# Domain Integration

## 项目背景
业务方认为论坛、课堂、活动、社区主页存在于分散的域名中，影响用户体验，因此希望将其全部整合到一个域名下。

## 功能要求

- 论坛：`community.atlassian.com` --> `community.atlassian.com/forums`

- 课堂：`university.atlassian.com` --> `community.atlassian.com/learning`

- 活动：`ace.atlassian.com` --> `community.atlassian.com/events`

- 社区主页： 新设计的落地页，需要放在 `community.atlassian.com` 上

- 个人主页：新开发的个人主页前端，需要放在 `community.atlassian.com/user` 上

## 项目难点

需要整合到统一域名下这些网站的 infra 各不相同：
- 课堂、社区主页、个人主页是第一方（Atlassian 开发）的，每个网站都有自己的 code repository，通过内部前端基建部署在各自独立的 CloudFront 上。
- 论坛、活动分别是来自Khoros 和 Bevy，两个第三方 SaaS 供应商的网站。网站完全由供应商管理，一个在供应商自己的 AWS 上，另一个在供应商自己的 Google Cloud 上，仅通过 CNAME 绑定 Atlassian 域名。
- AWS Cloudfront 有很多坑...


## 解决方案

当我们提到 “一个域名下运行多个子应用”，通常会想到两种方法：微前端或者反向代理。理论上来说，如果所有的子应用都是第一方（Atlassian 开发），那确实可以考虑[微前端](https://micro-frontends.org/)方案。但我们还需要整合第三方供应商的网站，考虑到我们很难甚至不可能对第三方网站的前端代码做改造，因此 [反向代理](https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/) 成为了最合适的解决方案。

通过反向代理，我们不仅可以将多个一方和三方网站放在一个域名下，还可以利用运行速度极快（不到一毫秒）的 CloudFront Function (边缘函数) 实现按需修改 HTTP request / response 内的 URL、header 等信息，以达到 301 重定向、添加额外 header 、根据 IP 或 URL 进行访问控制等目的。

我在此项目中实现的反向代理主要由以下几个部分组成：

### 请求转发
首先，我们需要在 CloudFront 中，为每个第三方网站创建 Custom Origin，配置所需的 Origin Request Policy 和 Cache Policy。
其次，在 CloudFront 的 "Behaviours" 里，我们需要对每个 pattern 创建一个“行为”，绑定其所属的 Origin 和需要在这个 behaviour 上运行的边缘函数。

![](/img/bahaviour.png)

### 访问控制

在内部测试和 rollout 过程中，我们结合使用了两种方法来控制访问权限：

- AWS WAF（允许供应商的 IP 访问我们内部的测试环境，以配合调试）
- CloudFront Function（根据 request 的 IP 地址、URL等信息，进行重定向，来达到访问控制的目的）

### 重定向
在 CF 层面进行重定向，可以通过 CloudFront Function 高效完成。不过要注意几个坑：

![](/img/way-of-redirection.png)

#### 在重定向时保留 query param
由于我们希望原本论坛帖子的链接在域名整合后还可以继续访问，因此需要创建一个 301 redirect， 从这样的一个URL

```
https://community.atlassian.com/t5/how-to-earn-badges?utm_medium=email
```

重定向到这样的一个URL：

```
https://community.atlassian.com/forums/how-to-earn-badges?utm_medium=email
```

看起来像是一个简单的 `.replace()`就能解决，对吧？要真这样就好了...然而现实中，cloudfront 的 request object 并不是这样。
从下图中可以看到，URL 并不是作为一个完整的字符串给出的，而是被拆分成了三部分。（而且 querystring 还会被进一步拆分成多个部分）

![](/img/cloudfront-object.png)

当我们想要执行 301 重定向时，需要像这样，把新的 URL 作为一个完整的字符串来提供：

```javascript
return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { "location": { "value": "https://community.atlassian.com/forums/how-to-earn-badges?utm_medium=email" } }
};
```

这意味着我们必须从 cloudfront event 对象中“组装”出新的 URL。包括 query param 部分。

:::note

有1说1，AWS为啥要把一个 object 叫做 “querystring” 。。。真的很迷惑

:::

你可能会想：

> 听上去还好啊，用 npm 里 query-string 这样的库就行了呗？

可惜不行。有两个原因：

首先，CloudFront function 里不能 “import/require” 任何外部库。尽管理论上可以把库（和它所有依赖）的代码全都复制进来，但这还是不现实。（先不说代码得有多乱，肯定也超过 10KB 的大小限制了）
其次，CloudFront event 里的 "querystring" 压根不是标准的 URLSearchParams object。就算能import query-string 这个库，也没法 parse 它。

因此，我在 CF function 里手动 parse 了一波：

```javascript
function handler(event) {
    const request = event.request;
    const host = request.headers.host.value;
    const newURL = new URL(`https://${host}`);
    newURL.pathname = request.uri.replace('/t5/', '/forums/');
  
    if (request.querystring) {
        Object.entries(request.querystring).forEach(([name, valueObj]) => {
            newURL.searchParams.append(key, valueObj.value);
        });
    }

    return {
        statusCode: 301,
        statusDescription: 'Moved Permanently',
        headers: { "location": { "value": newURL.href } }
    };
}
```

这段代码，我在本地 node 20 下测试完全没问题。但放在 CloudFront 上运行时，就报错：

> Error: ReferenceError: "URL" is not defined

对的，从 Node 6 里就有的[URL](https://developer.mozilla.org/en-US/docs/Web/API/URL)，在最新的 [CloudFront JS runtime 2.0](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-javascript-runtime-20.html) 里并不存在。就问你意外不意外。

得，那咱只能放弃好用的 `URL`，硬生生给 query string 拼出来。

```javascript
function handler(event) {
    const request = event.request;
    const host = request.headers.host.value;
    const pathname = request.uri.replace('/t5/', '/forums/');
    
    let newURLString = `https://${host}${pathname}`;
    
    if (request.querystring) {
        const queryParams = [];
        Object.entries(request.querystring).forEach(([key, valueObj]) => {
            queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(valueObj.value)}`);
        });
        
        if (queryParams.length > 0) {
            newURLString += '?' + queryParams.join('&');
        }
    }

    return {
        statusCode: 301,
        statusDescription: 'Moved Permanently',
        headers: { "location": { "value": newURLString } }
    };
}
```

这下总可以了吧？

然而不行。这次又报错：

> The CloudFront function associated with the CloudFront distribution is invalid or could not run. SyntaxError: Unexpected token "=>" in 10

无语了真的。这个 runtime 连箭头函数都不支持。成吧，咱再手动把箭头函数改成普通函数。

```javascript
Object.entries(request.querystring).forEach(function([key, valueObj]) {
    queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(valueObj.value)}`);
});
```

这下总该可以了吧？

还是不行。这次的报错是：

> SyntaxError: Token `"["` not supported in this version

好吧，destructure 语法也不支持。咱再改。

```javascript
Object.entries(request.querystring).forEach(function(entry) {
    const name = entry[0];
    const valueObj = entry[1];
    queryParams.push(`${encodeURIComponent(name)}=${encodeURIComponent(valueObj.value)}`);
});
```

终于，这个版本不再报错，可以正常使用了。不过还有最后一点需要注意：js 里 `if` 可以判断空字符串，但不能判断空对象。（因为 `Boolean({}) === true`）， 所以 `if (request.querystring)` 其实没意义。正确的做法是用 `Object.keys(request.querystring).length > 0` 判断是否有 query param。因此，最终完整的 CF function 如下：

```javascript
function handler(event) {
    const request = event.request;
    const host = request.headers.host.value;
    const pathname = request.uri.replace('/t5/', '/forums/');
    
    let newURLString = `https://${host}${pathname}`;
    
    if (Object.keys(request.querystring).length > 0) {
        const queryParams = [];
        Object.entries(request.querystring).forEach(function(entry) {
            const name = entry[0];
            const valueObj = entry[1];
            queryParams.push(`${encodeURIComponent(name)}=${encodeURIComponent(valueObj.value)}`);
        });
        newURLString += '?' + queryParams.join('&');
    }

    return {
        statusCode: 301,
        statusDescription: 'Moved Permanently',
        headers: { "location": { "value": newURLString } }
    };
}
```


## 第一方子应用的改造

### Router basePath
该项目使用了 react-resource-router 的 `Router`。因此，我们需要添加 `basePath` 属性，如下所示：

```javascript
<Router routes={...} history={...} basePath='[subapp path]'>
```

### assets URL
既然域名换了，parcel编译时的静态资源域名也需要换，得从原本的 `--public-url /assets/` 变成 `--public-url community.atlassian.com/assets/[subapp path]`。