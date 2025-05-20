---
sidebar_position: 3
---

# Bug hunting

Bugs I found in recruiting system when applying to companies.

## IBM
### Can't apply
This article shares an issue I encountered trying to apply to IBM, where the applicant are redirected to a login page in error. I briefly analyzed this issue and reported it to IBM. This issue was fixed a few days later.
### Level of Impact
**Serious** (Applicants are not able to apply.)
### Steps to Reproduce
1. Choose any position on IBM Careers Page
2. Click “APPLY NOW” Button
3. Fill out the contact form, click either of the two buttons (“Connection and Apply” or “Skip and Apply”)

BUG: The page redirects to a login page on 2x-dc2.kenexa.com

### Analysis
Upon clicking the submit button, browser sends a POST request to brassring.com to authenticate. The server responded a HTTP 302 status code, telling the browser that the resource requested has been temporarily moved to another location under the domain 2x-dc2.kenexa.com.

![](https://i.imgur.com/xyzU8kQ.png)


Therefore, the browser then sends a GET request to `https://2x-dc2.kenexa.com/wps/myportal/$tenant/IBM/`. But the server, again, responded a HTTP 302 status code, asking the browser to redirect to `https://2x-dc2.kenexa.com/wps/redirect`, and also setting some cookies in the browser.
But, the value of the cookie WASReqURL was set to `https:///wps/`. Two things are wrong with this URL.

1. extra slash after the protocol
2. missing domain name

![](https://i.imgur.com/vCgOA5W.png)


After a bit of research, I fond that this issue was mentioned, and was attempted to be fixed in the past:
`https://github.com/OpenLiberty/open-liberty/issues/7920`
`https://www.ibm.com/mysupport/s/question/0D50z000062l3Jw/wasrequrl-cookie-path-missing-for-applications-with-context-root-set-to-when-webappsecuritys-includepathinwasrequrltrue`

However, the behavior I encountered still matches the bug description, where the context was set to root “/”. (Which is what we saw, as the extra slash and missing domain).

Due to this URL path error in cookie, when the browser sends the third request, the WASReqURL cookie is not included in the request header.

![](https://i.imgur.com/IUH5gmb.png)


when `https://2x-dc2.kenexa.com/wps/redirect` received the redirect request, it had no idea where to find the requested resource. This resulted in yet another HTTP 302 response.

response of the third request
In the end, the applicants is redirected to the login page of `http://2x-dc2.kenexa.com/`, and cannot start their application.

### Summary

This is most likely a backend issue of the IBM library Open Liberty. Since the bug of the library was attempted to be fixed back in 2019, the fact that this issue is recurring today on October 11/2020, might be caused by an incorrect deployment of the backend. Possible solution may be checking the library settings to make sure the cookie WASReqURL can be set correctly.
