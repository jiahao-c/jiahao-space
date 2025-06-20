# Jira AI 搜索

## 项目背景
在客服工单系统中，客服人员(Support Agent)希望可以利用 AI 快速找到所需的知识库文章(KB, Knowledge Base)，以增加工单解决效率。

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
- 项目时间很紧，从 PRD 到第一版上线只有一个月时间
- 设计师突然离职了，只留了一张 figma 图
- 作为一个fullstack组，组内技能不均衡，3个工程师都偏后端，只有我偏前端
- Jira DC 的 SDK 默认不支持 React，只支持 Apache Velocity（只有 Jira Cloud 的 SDK 对 React 支持较好），需要通过各种 workaround 来实现在 Jira web panel 中内嵌 React。
- 项目上线后，法务团队突然提出合规问题，需要紧急修复

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
    panelScript.src = 'https://[internal-domain]/assets/script/kms-app/index.js' + `?v=${Date.now()}`;
    panelScript.appendChild(kmsJS);
</script>
```
这样就确保了每次访问时，都能获取到最新的资源。虽然这个办法看上去比较丑，但由于这个特殊使用场景下的诸多限制（包括 Jira SDK的限制、内部前端基建的限制），这个方法是个切实可行的 workaround。
、

### 埋点问题

数据科学方提的埋点需求之一是，记录用户折叠或展开 AI panel 的事件。问题是，Jira panel 的折叠按钮，是在 React 应用之外的，是 jira 页面本身 DOM 的一部分，我们无法在 React 应用里直接添加一个 onClick 来捕获这个事件。

我想到的解决方案是，通过一个 MutationObserver 来监控

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
Atlassian 设计系统内没有"折叠面板"这种组件。因此我自己在项目中实现了这个组件：


## 业务方和同事对我的反馈：

Rachel Sterns, TPM
> In January, the AI Agent team lost their designer and had several new changes and features to launch. Jiahao stepped up to take ownership of much of this work, on top of his technical scope of work. The team all supported this work, but Jiahao lead and was thoughtful with visuals, seeking clarity, and validating assumptions. He was open to feedback, responsive to needs, and also still delivered on technical activities required. I believe we have made as much rapid progress as we have with this tool because Jiahao has performed so strongly as a leader in this area for the design and in helping us understand the feedback needed.

Jennee Natenzon, TPM:
> Throughout the execution of the AI Assist program, Jiahao was a great partner. He was critical to the program’s success.
- Jiahao continuously brings clarity to the program. His efforts ensure a smooth development process, where everyone feels included and is on the same page. Examples:
  - For AI Search, Jiahao clearly documented the user journey and UI. This ensured that we accounted for all the scenarios and the solution was comprehensive.
  - When we learned of a new legal requirement for HIPPA customers, Jiahao helped to drive clarity and finalize the solution. He did this by listening to the problem statement, creating a process flow diagram, iterating on it based on Slack feedback, and revisiting it during a meeting. 
- Jiahao ensured that the design process was collaborative and transparent. He made it easy to engage and often asked for feedback. He explained the rationale behind each option as well as the technical constraints. He always follows up and has proven to be incredibly reliable. 

Tom Alberecht, Data Scientist:

- Jiahao executes with great urgency and often has fixes deployed within hours of identifying a potential issue. When developing AI Agent Assist, he would often have bug fixes and smaller feature changes deployed within an hour or two of team agreement on how we should approach the feature/bug-fix, allowing for much faster iteration.
- Jiahao approaches problems with curiosity and proactively suggests several ways to solve a problem. For the AI Agent Assist project, he would often take the initiative to brainstorm a few proposals and reach out to get agreement/consensus from the team in order to make decisions more quickly and efficiently.

Steven Wilkins, Senior Software Enginner
> Jiahao was the primary contributor to the front-end work for AI Assisted search. His work included initial and followup UX design as well as significant contributions to the front end such as showing GSAC results in search and adding the search component to the react application (among many other contributions). Additionally, Jiahao is very productive in his work and is able to turn around issues very quickly allowing for rapid fixes. Jiahao’s contributions were instrumental in allowing us to launch search on time without issue.

Bri Vargas, Senior Software Engineer

Jiahao’s proactivity has been essential to the team’s success this year. He is often the first to volunteer to take on new tasks, first to respond to customer questions, and frequently asks clarifying questions to make sure the rest of the team is on track with their own tasks. This proactivity was especially important during the AI Assist Search project during which Jiahao stretched in his role to also act as our UI/UX designer, making mockups often within minutes of a feature idea being brought to the table by stakeholders. The visuals he provided for feature design discussions allowed for quick alignment and was met with great feedback from stakeholder teams. In the end, his actions were essential to the quality and on-time delivery of the Search capability.