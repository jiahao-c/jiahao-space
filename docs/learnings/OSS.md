---
sidebar_position: 2
---

# Stuff I learned from OSS Contributions

## arco-design

### Type Error

I encountered a type error while using arco-design for myExams2. After testing and documentation reading, I confirmed that `'top'` and `'bottom'` are also valid values for `mode`, and the default value should be `top` when `direction === 'horizontal'`.

![](https://i.imgur.com/hGyNA1g.png)

Therefore, I submmited a PR to fix this issue by fixing the type definition:
![](https://i.imgur.com/A9lnQCz.png)

### Optional Children
When I used the `Select.Option` component from Arco, I noticed that it requires children nodes, which is inconvenient. So I asked for opinion of the proposed syntax, and created a PR using Nullish coalescing operator (??).
![](https://i.imgur.com/ReXqvHz.png)
![](https://i.imgur.com/ZZ8sxx3.png)




## svg-cowbar
I encountered a problem while developing Easy Syntax Tree. That is, the export-to-PNG does not work. But the export to SVG still works fine.

![](https://i.imgur.com/UKi6U9g.png)

I am using the library “svg-crowbar” to handle SVG/PNG exports in Easy Syntax Tree. So I assumed it’s a library issue. Then, I checked the console:

![](https://i.imgur.com/hcW9ACJ.png)

With some google search, I found the problem is due to some JavaScript base64 encoding issues. The recommended solution is available on MDN:

![](https://i.imgur.com/nYWpAfP.png)

So I submitted an issue to the library:

![](https://i.imgur.com/x3SCSkA.png)

Then, following instruction on MDN, I fixed the issues and created a Pull Request:

![](https://i.imgur.com/Reos4wy.png)
![](https://i.imgur.com/7TIU9Qv.png)
