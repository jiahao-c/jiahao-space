# SSR

## 项目背景

业务方希望通过把现有 CSR 的 社区主页 和 课堂 都改造为 SSR，来提高首屏加载速度，并增加对内部 AI 爬虫的支持（内部 AI 爬虫目前只能爬 SSR 网站）

通常提到 SSR，大家就会想到 Next.js，它可以跑在 Vercel 、AWS Amplify 等 infra-as-service 上，也可以直接跑在 nodejs 服务器或者 docker 容器里。
但是，Atlassian的内部前端基建并不支持 Next.js，也不支持 React Server Components。

Atlassian 的 SSR infra 是内部自研的，基于 jsdom 的一套方案，跑在 kubernetes上。所以，咱们只能简单的把 CSR 改造成 SSR，但没法用 RSC 里各种高级的功能。

## 解决的问题和学到的东西

### 浏览器端 API

- window, document, localStorage 这些浏览器 API 在服务器端都没有，用的时候要检查是不是在client side code里。例如，如果要用 `window.CSS.supports(...)` 检查浏览器是否支持一个属性，需要先 `(if window.CSS && window.CSS.supports)`.

- 如果要在 SSR 页面里用 scrollIntoView 来控制页面位置，使得如果用户通过带特定 hash 的 URL访问页面，能自动滚动到特定位置，需要写在 useEffect 里：

```jsx
const formRef = useRef();

useEffect(()=>{
    if (window.location.hash === '#apply' && formRef.current){
        formRef.current.scrollIntoView();
    }
}, [])
<form ref={formRef}>
```

### GraphQL

### 环境变量

### 路由

内部前端基建的 [react-resource-router](https://github.com/atlassian-labs/react-resource-router) 支持 CSR 和 SSR，所以基本不用对路由做什么修改。