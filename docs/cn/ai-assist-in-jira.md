# AI 知识库面板

## 项目背景
在客服工单系统（Atlassian 内部的一个特殊 Jira DC 实例）中，客服人员（Support Agent）希望借助 AI 快速定位所需的知识库文章（KB, Knowledge Base），以提升工单处理效率。

![](/img/kb-ai.png)


## 功能要求
- 客服打开工单时，可直接看到 AI 预先生成的 KB 推荐
- 客服可在输入框中聚合搜索，查找所需知识库文章
- 客服可选择知识库文章，由 AI 生成参考回复


## 项目架构

后端上游（由 AI 团队提供）：用于 KB 推荐、搜索(基于 elastic search / RAG)、和生成(基于 LLM)的 API 

后端：Spring Boot, DynamoDB, SQS


前端：React（通过 [web panel](https://developer.atlassian.com/server/jira/platform/web-panel/) 内嵌在Jira中）


## 项目难点
- 项目启动前，设计师突然离职了，留下的 Figma 里只有一张供参考的设计图，距离完整的设计文件有很多欠缺，需要我和产品经理协作完善设计和交互细节。
- Jira DC 和 内部前端基建有诸多限制，这个项目是公司内第一个在 Jira DC 的 SDK 里嵌入 React 的项目，没有先例方案可以参考。 (相比之下 Jira Cloud 的前端架构要现代很多，完全 React，插件系统也很好用，可惜客服工单系统是在 Jira DC 上)
- 在开发项目第一版时，内部 AI 服务还不支持 SSE，因此只能通过用起来较为复杂的 Web Stream API 来实现流式输出

## 我的贡献
- 主动制作交互流程文档，与产品经理对齐需求，明确加载、报错等各类场景的预期表现
- 作为前端 feature lead，设计前端实现方案，通过实验验证可行性，拆解任务、理清依赖，稳步推进开发

## 我解决的技术问题 

### AI 生成工单回复

项目的功能之一是，客服人员可以在工单的评论框里通过 AI 根据选中的知识库文章生成回复。

![](/img/create-reply.png)

在接到这个需求时，我首先将其实现拆分为两个主要部分：
1. 在评论框的工具栏添加 AI 按钮和 DropDown Menu（需要用到 Jira DC 插件系统中用于自定义编译器的 API）
1. 在将AI生成的内容流式输出到评论框内

#### 拓展编辑器工具栏

想要在 Jira DC 的编辑器工具栏增加一个按钮，得先在 Jira 插件的 `/resources/atlassian-plugin.xml`中用 [Jira Editor Registry](https://developer.atlassian.com/server/jira/platform/customizing-rich-text-editor-in-jira/) 来注册上按钮的 `<web-resource>`。

:::note

吐槽一下，关于[拓展编辑器工具栏的官网文档](https://developer.atlassian.com/server/jira/platform/extending-the-rich-text-editor-in-jira/)，已经N年没更新了，里面全是过时的信息和截图，导致我当时基本得靠翻最新的 Jira DC 源码来摸索...

:::

然后，在插件的前端代码中，手动在编辑器工具栏 DOM 里新建一个div，然后用 React 把按钮渲染进去：

```jsx
const toolBarElement = document.querySelector('.aui-toolbar2-primary');
const buttonDiv = document.createElement('div');
buttonDiv.id = 'ai-button-contrainer';
buttonDiv.className = 'aui-buttons';
toolBarElement.append(buttonDiv);

ReactDOM.render(<AiEditorButton /> ,buttonDiv)
```


#### 获取 API 的流式输出

一开始，内部 AI 服务还不支持 SSE，所以第一版中的流式输出是通过 Web Stream API 来实现的。

众所周知，fetch 所返回的 [Response.body](https://developer.mozilla.org/en-US/docs/Web/API/Response/body) 是一个 [Readable Stream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)，并且， promise 在收到 header 后就会resolve， 而不会等整个body都stream完才resolve。所以我们可以先 await 这个请求：
```javascript

const payload = {"selectedArticleID": xxx, "searchId": yyy};

const response = await fetch(api, {
    method: 'POST',
    body: payload,
    credentials: 'include',
    signal: abortController.signal,
    mode: 'cors'
})
```

然后通过一个 AsyncGenerator （yield Promise 的generator） 来流式处理这个response。
```javascript
async function* streamingContent({
	// ... 各种参数
}{
	const reader = body.getReader(); //ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>
	const decoder = new TextDecoder('utf-8'); //由于服务返回的是binary data，得先解码
	let buffer = ''; //用buffer解决数据可能不完整的问题
	let done = false;

	while (!done) {
		const { value, done: doneReading } = await reader.read();
		done = doneReading;
		const chunkValue = decoder.decode(value); //把binary data转换为UTF-8编码的markdown
		buffer = buffer + chunkValue;
		const lines = buffer.split('\n'); 
		while (lines.length > 1) { // >1 而不是 >0，因为最后一行可能还没完整输出出来
			const line = lines.shift()!; // 对 queue 中最前面的内容进行处理
			yield line; 
		}
		// 把最后一行放回buffer里
		buffer = lines[0];
	}
}
```

#### 流式插入到编辑器

在用上面的async generator 接收到内容后，我们可以用 `for await` 的方式来将其进行格式转换并插入到编辑器里。由于 LLM 返回的是 markdown，在插入先，还需要先转换为 Jira DC 所使用的 [Wiki Markup](https://jira.atlassian.com/secure/WikiRendererHelpAction.jspa?section=all)

```javascript
async function startStreaming(/*...各种参数*/){
	//通过上面的 async generator，获取一个 async iterable
	const streaming = streamingContent({/*...各种参数*/});

	for await (const item of streaming) {
		const jiraFormatText = markdownToJira(item);
		// 把内容插入到编辑器中
		entry.applyIfTextMode(() => addWikiMarkup(entry, jiraFormatText))
	}
}
```

#### SSE

后来，内部AI服务新增了对 SSE 的支持，并且可以自动分行并输出markdown格式，于是第二版中的流式输出改为使用更简单的 SSE 来实现，大幅简化了这部分代码。

```javascript
function startSSEStreaming() {
     /* EventSource 只支持 GET，还好我们只需要传两个参数，所以可以直接放在 query params 里*/
    const queryUrl = `${sseApiUrl}?searchId=${searchId}&selectedArticleId=${selectedArticleId}`;
    const eventSource = new EventSource(queryUrl, { withCredentials: true });
    
    eventSource.onmessage = function(event) {
        const jiraFormatText = markdownToJira(event.data);
        entry.applyIfTextMode(() => addWikiMarkup(entry, jiraFormatText));
    };
}
```

### 资源缓存问题
背景：

首先，Jira DC SDK 默认不支持 React，只支持 Apache Velocity（只有 Jira Cloud 的 SDK 对 React 支持较好）。 因此我需要通过一些 workaround 来实现在 Jira web panel 中内嵌 React，也就是将 script tag 硬编码在插件的 Apache Velocity 模版中。当 jira 页面加载出 panel 后，浏览器再去加载和执行这一行 script，最终将 react 应用渲染到页面的指定 div 中。


```html
<div id="kms-panel"></div> <script type="module" src="https://[internal-domain]/assets/panel-react/index.js"></script>
```


内部基建要求所有的前端应用都使用 internal frontend gateway (基于 CloudFront, S3, Route 53)。正常情况下，每次部署新的静态资源，都会生成新的hash，例如 `index.c2394f3e.js`。
![](/img/version-hash-param.png)
![](/img/version-hash-filename.png)

可是，由于Jira 插件只能手动部署，无法通过 CI/CD 自动部署， 如果每次部署前端时都更新一遍插件里的文件名，则会太低效。因此只能用上面这样不带hash的文件名。

问题：

在测试时我发现，当新的静态资源被部署时，由于没有hash，浏览器不会自动抓取最新版本，除非用户手动强制刷新页面。

理想情况下，我们可以通过在 frontend gateway 中对资源设置 `Cache-Control: no-cache` 来解决这个问题。遗憾的是，当时内部前端基建并不支持自定义 Cache-Control header。它被固定在 `max-age=31536000, s-maxage=3153600`。

解决方案：

作为一个 hacky workaround，我打算在Jira 插件中硬编码的URL后添加`?v=Date.now()`，来强制每次访问都重新获取资源，以达到 `Cache-Control: no-cache` 的效果。

这又带来另一个问题：我们并不能在一个 HTML 标签的属性里面直接写 js：
```html
<div id="kms-panel"></div> 
<script type="module" src=`...${v=Date.now()}`> // 运行不了
```
于是最终的方案是，在一个 script 标签内，动态创建另一个script标签。
```html
<div id="panel-root">
</div>
<script>
    const panelRootElement = document.getElementById('panel-root');
    const panelScript = document.createElement('script');
    panelScript.type = 'module';
    panelScript.src = 'https://.../assets/script/kms-app/index.js' + `?v=${Date.now()}`;
    panelScript.appendChild(kmsJS);
</script>
```
这样就确保了每次访问时，都能获取到最新的资源。虽然这个办法看上去比较丑，但由于这个特殊使用场景下的诸多限制（包括 Jira SDK的限制、内部前端基建的限制），这个方法是个切实可行的 workaround。


### 组件问题
在第一个版本中，每条 KB 推荐需要以 “可预览折叠面板” 的方式显示，即展开前显示标题+前三行内容，展开后显示完整内容。 Atlassian 设计系统内没有"折叠面板"这种组件，没法直接拿来用。因此我自行实现了这个组件：

![](/img/kb-ai-collapse.png)

#### "三行"问题
如何让一个div只显示“前三行”内容呢？
首先，markdown渲染出的div，每行内容长度是可长可短的，有可能会有一个很长的 `<p>` 因此需要用 `work-break: break-word` 使得右边的文字不会溢出。
其次，对于div高度的设置，如果使用 `max-height` 属性，即使采用 em 等相对于字体大小的单位，也不能满足需求，因为被渲染出的markdown除了 `<p>` 这种普通文字之外，还有 `<h2>` 之类更“大”的文字，或者存在空行。这会导致 cutoff 的问题：

![](/img/kb-ai-cutoff.jpeg)


我的解决方案是，使用 `line-clamp` 属性：

```tsx
const MarkdownContainer = styled.div`
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    ${({isExpanded}) => `-webkit-line-clamp: ${isExpanded ? 'none;' : '3;'}`};
```

这种做法也会带来一个问题：`transition` 不能和 `line-clamp` 一起使用，因此原有的折叠-展开时的动画效果就没了。

### 用 Custom Hook 减少 DOM 操作
我们的 React panel 中很多地方要用到当前工单的元数据，例如 ticketKey, labels 等等。这些数据需要从外层 DOM 中抓取。如果每次都去直接 query DOM，会造成代码重复、也略微影响性能。因此我写了一个简单的 custom hook. 其中用到了 TS 中的 Partial，因为有时我们只需要取出其中几项 metadata 来用。
```tsx
interface TicketMetadata {
    ticketKey: string;
    labels: string[];
    ...
}

const useTicketMetadata = (): Partial<TicketMetadata> => {
    const [ticketMetadata, setTicketMetadata] = useState<Partial<TicketMetadata>>({});
    const ticketKey = document.querySelector('[data-issue-key]')?.textContent;
    const labels = Array.from(document.querySelectorAll(#wrap-labels li span), (span) => span.textContent);
    ...

    return ticketMetadata;
}
```

使用时可以任意选取需要的 metadata：
```jsx
    const { labels } = useTicketMetaData();
```
