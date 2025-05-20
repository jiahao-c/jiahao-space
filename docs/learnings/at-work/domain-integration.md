# Domain Integration

## Intro

Initially, each app (1p Atlassian-owned and 3p vendor-owned) had its own domain. For example, forums was at community.atlassian.com and learning was at [university.atlassian.com](http://university.atlassian.com).&#x20;

The business wanted the apps to be consolidated under one domain. This is the fundamental part of the connected experience for Community.&#x20;

To implement multiple apps under one domain, there are two common approaches: micros-frontend and reverse proxy. If all apps were 1p, we could theoretically use a micro-frontend approach ([https://micro-frontends.org/](https://micro-frontends.org/)). But since there are 3p apps, we’d have to use a reverse proxy ([https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/](https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/) ) approach.



In our context, the reverse proxy is not a single service or resource. It’s a solution consisting of multiple pieces across Atlassian infra, first-party bifrost apps, third-party vendor apps. Working together, they serves functionalities such as&#x20;

- Domain Consolidation (serving multiple Atlassian and vendor websites under one domain)

- Precise Access Control (IP-based / Path-based / Combined)&#x20;

- Fast Redirections (CF-function takes less than 1 **millisecond** to execute)

- Customizable Request Modification (HTTP URI / header / params)&#x20;

### Behaviours & Routing

![](/img/bahaviour.png)

### Access Control (WIP)

Envoy-level IP whitelist

CF Function

WIP.

### Ways of redirections

![](/img/way-of-redirection.png)



## Terminology

Community Homepage: [https://community.atlassian.com/](https://community.atlassian.com/)

- Events Splash Page [https://community.atlassian.com/events](https://community.atlassian.com/events)

- Champions Splash Page  [https://community.atlassian.com/champions](https://community.atlassian.com/champions)

- Forums  [https://community.atlassian.com/forums](https://community.atlassian.com/forums)

- Learning [https://community.atlassian.com/learning](https://community.atlassian.com/learning)
