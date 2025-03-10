---
sidebar_position: 8
---

:::note

This blog shares a problem I ran into regarding caching of remote assets in a jira p2 plugin

:::

## The Problem

I was developing a [Jira web panel](https://developer.atlassian.com/server/jira/platform/web-panel/) where the content is a React app. 

Unlike Forge app (for Jira Cloud), P2 plugin (for Jira Server/DC) does not natively support React apps. So we had to load it from an external script. The react app is hosted in an internal frontend gateway (where CloudFront & S3 are used as the infra layer) and injected into the Jira web panel like this:

```html
<div id="kms-panel"></div> <script type="module" src="https://[internal-domain]/assets/panel-react/index.js"></script>
```

The problem is, when the js gets updated, the browser does not know! 
Usually, for websites, there’s a version hash appended to a file name or query param.
![](/version-hash-param.png)
![](/version-hash-filename.png)

But for our special use case of a Jira P2 plugin, having to re-compile & re-install the plugin every time the frontend is updated is not ideal. (You can't use any continuous-integration for this...Jira DC plugin installation is a manual process).

What about using `Cache-Control` header in the frontent gateway that serves the js resource? 

Well, ideally, we can set `Cache-Control: no-cache`.

Unfortunately, due to the implementation of our internal infra, this header is not yet customizable. It is fixed to be `max-age=31536000, s-maxage=3153600`

So it looks like we'd have to manually append a version hash to the fixed file name to force fresh fetches. We can use `?v=Date.now()` for that.

But, the following code does not work because you can't run JS <b>inside</b> HTML tag itself.
```html
<div id="kms-panel"></div> 
<script type="module" href=`...${v=Date.now()}`>
```

The final solution is to create script tag dynamically:

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

This solves the niche problem of loading fresh resources Jira P2 web panel. You can consider it a workaround for the limitations in our specific use case & infra capabality. 