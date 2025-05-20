---
sidebar_position: 2
---

# Secret CF method to select origin

If you look into [AWS doc](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/helper-functions-origin-modification.html), you can find ways to switch origin such as `cf.updateRequestOrigin()` .

But, there's actually a secret method that AWS has not published in their documentation yet (as of March 2025). That is `cf.selectRequestOriginById()`. You can use it like this

```
import cf from `cloudfront`;

selectRequestOriginById(origin_id);
```

I learned this from contacting AWS support.

AWS is working on adding this to their public documentation. So you may expect to see it in AWS public documentation soon.


