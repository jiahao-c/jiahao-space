# SSR

## 项目背景

业务方希望通过把现有 CSR 的 社区主页 和 课堂 都改造为 SSR，来提高首屏加载速度，并增加对内部 AI 爬虫的支持（内部 AI 爬虫目前只能爬 SSR 网站）

通常提到 SSR，大家就会想到 Next.js，它可以跑在 Vercel 、AWS Amplify 等 infra-as-service 上，也可以直接跑在 nodejs 服务器或者 docker 容器里。

但是，Atlassian 的 SSR infra 是内部[自研的，基于 jsdom 的，跑在 kubernetes上的一套方案](https://www.atlassian.com/blog/atlassian-engineering/cloud-overview#Server-side-rendering)，甚至连 JS Runtime 也是基于 V8 自研的。 

这套内部前端基建并不支持 Next.js，也不支持 React Server Components。因此，这个 CSR--> SSR 改造主要是围绕着这套内部 SSR infra 进行的。

## 解决的问题和学到的东西

### Babel 和 Parcel 配置

想要使用 Atlassian SSR infra，我们得在 babel 配置里对 browser 环境和 node 环境分开处理，因此我们的配置文件有两个部分：
```json
{
    "env": {
        "browser": {
            // client side
        },
        "atlaspack-bifrost-template": {
            // server side
        }
    }
}
```
其中，对于 node 环境，我们必须用上好几个 infra 组提供的 babel 插件在 AST 上进行处理。这些件的主要功能有：

- 把 window, document 都替换成 `globalThis` （毕竟 node 里没有 window）
- Pre-evaluate 各类语句 （例如， 如果 `===` 两边都是literal，就直接替换成结果，比如 `true`，这个操作也叫 "Constant Folding" ）
- 把 `process.env.xxx` 这种 inline env var 替换成实际的值
- ...等等（由于保密需求，这里没法贴插件源码出来orz）

Parcel 是 Atlassian 内部要求使用的 bundler。在 parcelrc 里，我们需要把所有的 js 文件都交给 SSR infra 组提供的 transformer:
```json
{
    "transformers": {
        "*.{js, mjs, jsx, ts, tsx}": [
            "parcel-transformer-snapvm-globals"
        ]
    }
}
```

### renderToPipeableStream

除了 babel 外，我们也需要配置一个 template 文件，其本质上是一个 request handler。在这个文件中，我们需要用到最重要的 API 就是 `ReactDOM.renderToPipeableStream()`，它将给 SSR 的 JS runtime 提供一个 entry point。

```jsx

// 提前获取 feature gates
let featureGatesBootstrapValues;
try {
    // 此处省略获取用户账号信息的一些细节
    featureGatesBootstrapValues = await initializeSSRFeatureGates(...);
}    

renderToPipeableStream(
    <App />, //此处省略 App 外的 Router 和各种 Provider
    {
        bootstrapScripts: "/assets/main.js", // 因为内部前端基建，静态资源都在 /assets 里
        onShellReady() { // 服务器渲染好之后，就可以返回 html了
            response.setHeader('content-type', 'text/html'); 
            pipe(response);
        }
        //把各种变量提前写到window上，babel 转译 SSR bundle 时会把 window 变成 globalThis 的
        window.isSSR = true;
        window.__FEATURE_GATES_VALIES__ = ${JSON.stringify(featureGatesBootstrapValues)};
        ...
    }
)
```

### HydrateRoot

上面的 `renderToPipeableStream` 给 server 提供了 entry point，我们自然也需要给浏览器提供 entry point，并对页面进行“注水”（即加上 js）。这一步需要我们在 index.tsx 里用到同样是 ReactDOM 里的 hydrateRoot:

```jsx
import { createRoot, hydrateRoot } from 'react-dom/client';

if (isCSR) {
    // CSR 情况。当SSR失败时，会fallback到 CSR
    let root = createRoot(document.getElementById('root'));
    root.render(RootJSX);
} else {
    // SSR 情况
    hydrateRoot(document.getElementById('ssr-root'), RootJSX);
}
```



### 浏览器端 API

- window, document, localStorage 这些浏览器 API 在服务器端都没有，用的时候要检查是不是在client side code里。例如，如果要用 `window.CSS.supports(...)` 检查浏览器是否支持一个属性，需要先 `(if window.CSS && window.CSS.supports)`.

- `useLayoutEffect` 也没法直接在服务器端运行，所以需要使用 `const useIsomorphicLayoutEffect = isSSR ? useEffect : useLayoutEffect;`

#### 自动 scroll to fragment
- 社区主页里有一个 "报名表"。预期行为是，当 URL 里带 `#apply` 这个 fragment，就自动滚动到这个表的位置。 在 CSR 版本的代码中，我们得把它写 useEffect 里：
```jsx
const formRef = useRef();

useEffect(()=>{
    if (window.location.hash === '#apply' && formRef.current){
        formRef.current.scrollIntoView();
    }
}, [])
<form id="apply" ref={formRef}>
```
而在 SSR 版本代码中，我们则不再需要这个 useEffect，因为浏览器一开始收到的就是完整的 HTML，可以自动 scroll to fragment。

### GraphQL
这个项目中使用 GraphQL 来获取登录用户的头像、名字等信息。我们用 Relay Compiler 提前编译 GQL queries，并通过 Relay Babel plugin 来一起放进最终的服务端 JS bundle 中：
在 `babel.config.json` 里，我们需要设置一个存放编译好的 GQL artifact 的位置：
```json
"plugins": [
    [
        "relay",
        {
            "artifactDirectory": "./src/graphql/__generated__"
        }
    ]
]
```
在使用的时候，就直接从这里面导入：
```
import USER_QUERY, {type Userquery} from '../graphql/__generated__/Userquery.graphql;
```

### 路由

内部前端基建的 [react-resource-router](https://github.com/atlassian-labs/react-resource-router) 支持 CSR 和 SSR，所以基本不用对路由做什么修改。

### css 加载速度优化

我们还可以通过 `rel="preload"` 的方式，让浏览器提前开始下载所需要的资源，进一步加快页面加载速度：
```html
<link rel="preload" as="style" href="https://.../assets/atlaskit-tokens_light.css">
```

### 脚本加载顺序
在 Atlassian 社区新主页的上线过程中，我们需要满足 Compliance 要求，即如果用户选择不接受特定cookie，就不能运行 Google Tag Manager 中特定的跟踪脚本 (tags). 

![](/img/onetrust-setting.png)

为了达到这一效果，我们需要保证负责加载 Cookie Consent Banner 的脚本 (OneTrust)，先于 Google Tag Manager 脚本运行。

![](/img/onetrust.jpeg)

## 解决过程

如果我们直接将两个脚本放在 HTML template （index.html） 里，像这样：

```html
<html>
<head>
<script src="https://atl-onetrust-wrapper.atlassian.com/assets/atl-onetrust-wrapper.min.js" type="text/javascript"></script>
<script src="https://www.googletagmanager.com/gtm.js"></script>
</head>
<html>
```

虽然我们可以保证这两个 script 都在“注水”过程中被加载，（浏览器收到渲染好的 html 后，再加载）但这会造成一种 race condition，我们无法保证两个脚本加载的先后顺序。


首先，我尝试使用 `defer` 和 `async` 这两个属性。给需要先运行的脚本加上 async （下载完成后立刻运行），给需要后运行的脚本加上 defer （在 DOM parse后运行）

```html
<html>
<head>
<script async src="https://atl-onetrust-wrapper.atlassian.com/assets/atl-onetrust-wrapper.min.js" type="text/javascript"></script>
<script defer src="https://www.googletagmanager.com/gtm.js"></script>
</head>
<html>
```

经过测试，我们可以在浏览器 Performance tab 里看到 onetrust 脚本确实比 gtm 脚本先运行了。

![](/img/performance-tab.png)

但这其实是个巧合。async的原理（下载完成后立刻执行）是不能保证运行顺序的。因此，正确的做法是，两个 script 都用 defer：

```html
<html>
<head>
<script defer src="https://atl-onetrust-wrapper.atlassian.com/assets/atl-onetrust-wrapper.min.js" type="text/javascript"></script>
<script defer src="https://www.googletagmanager.com/gtm.js"></script>
</head>
<html>
```

这样，我们可以保证在第一个 script 下载和执行后，第二个 script 才被执行。