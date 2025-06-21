---
sidebar_position: 1
---

# CloudFront Function 限制

我在一个项目中大量使用了 CloudFront functions。以下是我的一些经验总结。

## 301 重定向

我需要创建一个 cloudfront function，将如下 URL 进行 301 重定向：

```
https://community.atlassian.com/t5/how-to-earn-badges?utm_medium=email
```

重定向到如下 URL（注意，唯一的变化是 /t5/ 变成了 /forums/）：

```
https://community.atlassian.com/forums/how-to-earn-badges?utm_medium=email
```

看起来像是一个简单的 url.replace()，对吧？我也希望如此。不幸的是，cloudfront 的 request 对象并不是这样。

![](/img/cloudfront-object.png)

下面是一个 Cloudfront event 的示例。可以看到，URL 并不是作为一个完整的字符串给出的，而是被拆分成了三部分。（而且 querystring 还会被进一步拆分成多个部分）

当我们想要执行 301 重定向时，需要像这样提供新的 URL（作为一个完整的字符串）：

```javascript
return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { "location": { "value": "https://community.atlassian.com/forums/how-to-earn-badges?utm_medium=email" } }
};
```

这意味着我们必须从 cloudfront event 对象中“组装”出新的 URL。是的，包括 query param 部分。

:::note

吐槽：为什么有人会把一个对象叫做“querystring”？

:::

你可能会想：

> 听起来也没那么糟。我们可以用 npm: query-string 这样的库，对吧？

不行。有两个原因：

(1) 你不能在 CloudFront function 里“import/require”任何外部库。CF Function 无法访问外部模块。理论上可以把库的代码复制进 CF function 作为内联代码，但这太不现实了。（想象一下把一个库和它的所有依赖都复制进一个函数里会有多乱，而且函数代码还必须小于 10KB。）

(2) cloudfront event 里的 querystring 不是标准的 URLSearchParams 对象。所以库也无法解析。

因此，我在 CF function 里自己写了转换代码：

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

我在本地 node 20 下测试没问题。但在 CloudFront 上运行时，报错：

> Error: ReferenceError: "URL" is not defined

没错，[URL 接口自 Node 6 就有了](https://developer.mozilla.org/en-US/docs/Web/API/URL)，但在最新的 CloudFront JS 运行时里并不存在。

好吧。放弃好用的 URL 对象，改用字符串拼接。

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

这应该可以了吧？

不行。现在报错：

> The CloudFront function associated with the CloudFront distribution is invalid or could not run. SyntaxError: Unexpected token "=>" in 10

惊喜！[CF JS runtime 2.0](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-javascript-runtime-20.html) 只支持**部分** ES6-12 特性。

好吧，手动把箭头函数改成普通函数。

```javascript
Object.entries(request.querystring).forEach(function([key, valueObj]) {
    queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(valueObj.value)}`);
});
```

这下总可以了吧？还是不行。又报错：

> SyntaxError: Token `"["` not supported in this version

好吧，解构也不支持。再改。

```javascript
Object.entries(request.querystring).forEach(function(entry) {
    const name = entry[0];
    const valueObj = entry[1];
    queryParams.push(`${encodeURIComponent(name)}=${encodeURIComponent(valueObj.value)}`);
});
```

终于，这个版本可以正常工作了。还有一个小坑：`if` 可以判断空字符串，但不能判断空对象。所以 `if (request.querystring)` 其实没意义，因为即使 querystring 是 `{}` 也会为真。正确的做法是用 `Object.keys(request.querystring).length > 0` 判断是否有 query param。因此，最终完整的 CF function 如下：

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

结论：写 CF function 时，要注意 CF 独特的 event 结构和极其受限的 JS 运行时。



## 最后一点

AWS 限制了 CloudFormation 中新建 CloudFront function 的数量为 3 个。Bifrost 团队之前并不知道这个限制。（AWS 文档里也没写。）我和 bifrost 团队一起排查神秘的部署失败时才发现了这个问题。
