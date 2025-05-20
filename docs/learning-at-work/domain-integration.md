# Domain Integration

## The Challenge
Atlassian aimed to consolidate its diverse community websites under a single domain, `community.atlassian.com`, to create a more cohesive user experience. However, the **disparate infrastructure** presents a major challenge: each site had its own domain, lives in different code repositories, and some of them are not even Atlassian-owned (i.e. 3rd party vendor sites).

- forums(3p): `community.atlassian.com`  --> `community.atlassian.com/forums`

- learning(1p): `university.atlassian.com` --> `community.atlassian.com/learning`

- events(3p): `ace.atlassian.com` --> `community.atlassian.com/events`

- homepage(1p): A new homepage would be created at `community.atlassian.com`

## The Solution

To serve multiple applications under one domain, two common approaches are micro-frontends and reverse proxies. While a [micro-frontend](https://micro-frontends.org/) approach could theoretically be used if all applications were Atlassian-owned, the presence of third-party applications necessitated a [reverse proxy](https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/) solution.


In this context, the reverse proxy isn't a single service. Instead, it's a comprehensive solution integrating various components across Atlassian's infrastructure, first-party applications, and third-party vendor applications. This collaborative approach enables the following key functionalities:

* **Domain Consolidation:** Seamlessly serves multiple Atlassian and vendor websites under a single, unified domain.
* **Precise Access Control:** Offers granular control over access based on IP addresses, URL paths, or a combination of both.
* **Rapid Redirections:** Leverages Cloudflare Workers for extremely fast redirections, executing in less than one millisecond.
* **Customizable Request Modification:** Allows for flexible modification of HTTP URIs, headers, and parameters.

### Behaviours & Routing

![](/img/bahaviour.png)

### Access Control (WIP)

During internal testing, two methods of access control were used to meet various needs of access control requirements

- AWS WAF (to allow certain internal/vendor IPs to visit the CloudFront Distribution)
- CloudFront Function (for fine-grained access control based on request metadata) 


### Ways of redirections

![](/img/way-of-redirection.png)
