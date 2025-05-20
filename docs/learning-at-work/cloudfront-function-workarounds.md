---
sidebar_position: 1
---

# CloudFront Function Limitations

I have used CloudFront functions extensively for a project. Below are some of my learnings.

## 301 Redirect

I need to create a cloudfront function to redirect(HTTP 301) from a URL like

```
https://community.atlassian.com/t5/how-to-earn-badges?utm_medium=email
```

to a URL like (note, the only change is /t5/ to /forums/)

```
https://community.atlassian.com/forums/how-to-earn-badges?utm_medium=email
```

Looks as easy as a url.replace(), right? I wish so too. Unfortunately, the cloudfront request object isn’t quite like that.

![](/img/cloudfront-object.png)

Here is an example Cloudfront event. As you can see, instead of have the entire URL as a single string, it breaks up it into 3 pieces. (Then further breaks the querystring into multiple pieces)

When we want to perform a 301 redirect, we need to provide the new URL as a single string like this:

```javascript
return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { "location": { "value": "https://community.atlassian.com/forums/how-to-earn-badges?utm_medium=email" } }
};
```

This means we have to “assemble” the new URL from the given cloudfront event object. Yes, including the query param part.

:::note

rant: Come on, why would anyone on earth call something “querystring“ when it’s actually an object?

:::

As this point, you might think:

> That does not sound too bad. We could just use a library like npm: query-string, right?

No. Two reasons:

(1) You can’t  “import/require” an external library in a CloudFront function. CF Function does not have any access to external modules. Theoretically, one could copy the code from a library as inline code in a CF function, but it is just unrealistic.  (Imagine copying all the code from a library and its dependencies into a single function, what a mess would that be. Not to mention that the function code has to be under 10KB.)

(2) The querystring in a cloudfront event is not written as a standard URLSearchParams object. So the library wouldn’t be able to parse it anyways.

Therefore, I wrote my own converter code within the CF function:

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

When I tested it locally in node 20, it works great.  But when I run the above code in CloudFront, I got an error:

> Error: ReferenceError: "URL" is not defined

Yep, [the URL interface that has existed since Node 6](https://developer.mozilla.org/en-US/docs/Web/API/URL) does not exist in latest CloudFront JS runtime.

Okay. Let’s ditch the nice, handy URL object and switch to string concatenation.

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

This should work, right?

No.  Now we get the error:

> The CloudFront function associated with the CloudFront distribution is invalid or could not run. SyntaxError: Unexpected token "=>" in 10

Surprise! [CF JS runtime 2.0](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-javascript-runtime-20.html) only supports **some** ES6-12 features.

Fine, let’s manually polyfill the arrow function.

```javascript
Object.entries(request.querystring).forEach(function([key, valueObj]) {
    queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(valueObj.value)}`);
});
```

This should work, right? Unfortunately no.  Now I get the error

> SyntaxError: Token `"["` not supported in this version

Ok, so destructing is not supported either. Fine, let’s polyfill again.

```javascript
Object.entries(request.querystring).forEach(function(entry) {
    const name = entry[0];
    const valueObj = entry[1];
    queryParams.push(`${encodeURIComponent(name)}=${encodeURIComponent(valueObj.value)}`);
});
```

Finally, this version works as expected. And there's actually one more caveat to note: `if` can check for empty string, but not empty object. So the check the check `if (request.querystring)` is meaningless because it is true even when querystring is `{}`. So `Object.keys(request.querystring).length > 0` is the proper way to check whether any query param exists. Therefore, the full, final CF function we use is:

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

Take home message: When creating a CF function, keep in mind of CF’s unique event structure and very-restricted JS runtime.



## One Last Thing

AWS has limited the number of new CloudFront function creations in a CloudFormation to 3. The Bifrost team was unaware of this limitation. (It is not mentioned anywhere in AWS documentation.) I worked with bifrost team to find out this during a mysterious deployment failure.
