# AI 知识库面板

## 项目背景
在客服工单系统 (Atlassian 内部一个特殊的 Jira DC 实例) 中，客服人员(Support Agent)希望可以利用 AI 快速找到所需的知识库文章(KB, Knowledge Base)，以增加工单解决效率。

![](/img/kb-ai.png)


## 功能要求
- 当客服打开一个工单，可以直接看到 AI 预先生成的 KB 推荐
- 客服可以对每个 KB 推荐的质量进行反馈
- 客服可以在输入框中进行聚合搜索，查找所需的知识库文章
- 客服可以勾选知识库文章，让 AI 生成参考回复


## 项目架构
后端上游（由 AI 部门提供）：用于 KB 推荐/搜索/生成 的 Restful API

后端：Spring Boot，DynamoDB, SQS
API：RESTful
前端： React (通过 [web panel](https://developer.atlassian.com/server/jira/platform/web-panel/) 内嵌在Jira中 )


## 项目难点
- 项目时间很紧，从 PRD 到第一版上线只有 2 个月时间
    - 小组内 4 个工程师需要从零完成前端、后端、Jira 插件等一系列开发任务
    - 作为一个fullstack组，组内技能不均衡，3个工程师都偏后端，只有我偏前端
- 项目启动前，设计师突然离职了，留下的 Figma 里只有一张供参考的设计图，距离完整的设计文件有很多欠缺。
- 初版上线后，法务团队突然提出合规问题，需要紧急修复
- Jira 和 内部前端基建有诸多限制，这个项目是公司内第一个在 Jira DC 的 SDK 里嵌入 React 的项目，没有先例方案可以参考。


## 我的贡献：
- 我主动制作了交互流程文档，和产品经理对齐、明确需求，处理加载屏、报错屏等各类情况。
- 作为前端 feature lead，我设计前端实现方案、通过实验来验证可行性。拆解任务、理清任务依赖，分配给小组里其他工程师
- 与产品经理和法务团队沟通并理解 HIPPA 合规需求，并短时间内开发解决方案

## 项目过程中我解决的技术问题 
### 资源缓存问题
背景：

内部基建要求所有的前端应用都使用 internal frontend gateway (基于 CloudFront, S3, Route 53)。正常情况下，每次部署新的静态资源，都会生成新的hash，例如 `index.c2394f3e.js`。
![](/img/version-hash-param.png)
![](/img/version-hash-filename.png)

DC 的 SDK 默认不支持 React，只支持 Apache Velocity（只有 Jira Cloud 的 SDK 对 React 支持较好），需要通过一些 workaround 来实现在 Jira web panel 中内嵌 React。
但由于 Jira DC SDK 对于 web panel 诸多限制，我们只能将 script tag 硬编码在插件的 Apache Velocity 模版中。当页面被加载时， script 再将 react 应用加载并渲染到页面的指定 div 中。
可是，由于Jira 插件只能手动部署，无法通过 CI/CD 自动部署， 如果每次部署前端时都更新一遍插件里的文件名，则会太低效。因此只能用不带hash的文件名：

```html
<div id="kms-panel"></div> <script type="module" src="https://[internal-domain]/assets/panel-react/index.js"></script>
```

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
、

### 埋点问题

数据科学方提的埋点需求之一是，记录用户折叠或展开 AI panel 的事件。问题是，Jira panel 的折叠按钮，是在 React 应用之外的，是 jira 页面本身 DOM 的一部分，我们无法在 React 应用里直接添加一个 onClick 来捕获这个事件。

我想到的解决方案是，通过一个 MutationObserver 来监控 DOM 中其他 node 的属性变化。这样就实现了监听 DOM 内任意节点的属性变化事件：

```javascript
const toggleButton = document.querySelector('button[aria-label="..."]');
const observerConfig = {attributes: true, attributeFilter: ['aria-expanded']};
const observer = new MutationObserver(()=>{
    if (toggleButton.getAttribute('aria-expanded') === 'false') {
        analytics.sendEvent(...)
    }
})
observer.observe(toggleButton, observerConfig);
```

### 组件问题
每条 KB 推荐需要以 “可预览折叠面板” 的方式显示，即展开前显示标题+前三行内容，展开后显示完整内容。 Atlassian 设计系统内没有"折叠面板"这种组件，没法直接拿来用。因此我自行实现了这个组件：

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

### Markdown 渲染下划线

Markdown 语法本身并不包含“下划线”功能，因此在上游 API 返回的markdown中，下划线是用 `<u> </u>` 标签来表示的。想要正确渲染这个markdown，除了 `react-markdown` 之外，还需要用到 `rehype-raw`:

```jsx
<Markdown rehypePlugins={[rehypeRaw]}> ... </Markdown>
```

这样就可以正常渲染包含下划线的markdown了。

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


## 业务方和同事对我的反馈：

Rachel Sterns, TPM
> In January, the AI Agent team lost their designer. Jiahao stepped up to take ownership of much of this work. He was thoughtful with visuals, seeking clarity, and validating assumptions. He was open to feedback, responsive to needs, and also still delivered on technical activities required. I believe we have made as much rapid progress as we have with this tool because Jiahao has performed so strongly as a leader.

Jennee Natenzon, TPM:
> Throughout the execution of the AI Assist program, Jiahao was a great partner. He was critical to the program’s success. Jiahao continuously brings clarity to the program. His efforts ensure a smooth development process, where everyone feels included and is on the same page. Examples: For AI Search, Jiahao clearly documented the user journey and UI. This ensured that we accounted for all the scenarios and the solution was comprehensive. When we learned of a new legal requirement for HIPPA customers, Jiahao helped to drive clarity and finalize the solution. He did this by listening to the problem statement, creating a process flow diagram, iterating on it based on feedback.  Jiahao ensured that the design process was collaborative and transparent. He made it easy to engage and often asked for feedback. He explained the rationale behind each option as well as the technical constraints. He always follows up and has proven to be incredibly reliable. 

Tom Alberecht, Data Scientist:

> Jiahao executes with great urgency and often has fixes deployed within hours of identifying a potential issue. When developing AI Agent Assist, he would often have bug fixes and smaller feature changes deployed within an hour or two, allowing for much faster iteration. Jiahao approaches problems with curiosity and proactively suggests several ways to solve a problem. For the AI Agent Assist project, he would often take the initiative to brainstorm a few proposals and reach out to get agreement/consensus from the team in order to make decisions more quickly and efficiently.

Steven Wilkins, Senior Software Enginner
> Jiahao was the primary contributor to the front-end work. Additionally, Jiahao is very productive in his work and is able to turn around issues very quickly allowing for rapid fixes. Jiahao’s contributions were instrumental in allowing us to launch search on time without issue.

Bri Vargas, Senior Software Engineer

> Jiahao’s proactivity has been essential to the team’s success this year. He is often the first to volunteer to take on new tasks, first to respond to customer questions, and frequently asks clarifying questions to make sure the rest of the team is on track with their own tasks. This proactivity was especially important during the AI Assist Search project during which Jiahao stretched in his role to also act as our UI/UX designer, making mockups often within minutes of a feature idea being brought to the table by stakeholders. The visuals he provided for feature design discussions allowed for quick alignment and was met with great feedback from stakeholder teams. In the end, his actions were essential to the quality and on-time delivery of the Search capability.