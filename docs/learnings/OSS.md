---
sidebar_position: 2
---

# from OSS Contributions

## arco-design

### Hanlding Decimal Point
I saw this peculiar issue in Arco (which fortunately has a screenrecording, very helpful for understanding the priblem). 
![](https://i.imgur.com/rcBN1FR.png)

After reproducing it with the codesandbox link provided by the issue author, I confirmed the validity of this issue. But why?  Is it a precision issue? Is it a formatter issue? The root cause seems blurry. 

Therefore, I first tried to create a **Minimal Reproducing Code Block**. I noticed that, even when there's no props passed at all （i.e. just ` <InputNumber/>`, the issue still persists. Therefore, we can first rule out Wrong API usage (i.e. passing wrong props values)


I started investigation by reading the code of the `InputNumber` component and tried to understand the logic flow of its input handling.
![](https://i.imgur.com/dZc1hqX.png)
We can see, the input string will go through the following process before it gets set into values.

1. `s.trim()`
2. `s.replace()`
3. `parser(s)` (since a regex parser is defined by default)
4. `isNumber(+s)`
5. `getLegalValue(s)`

So the problem is probably in one of these methods, right? So I started testing each methods one-by-one. Details are omitted here. Eventually, I did not find any errors in these methods and their dependency methods. What could gone wrong?

I started to re-read the code, hoping to get my epiphany. After half an hour of reading and trying, it came to me. I found that, when the `targetValue` is just `.`, none of the conditions in the if statement will be `true`.  So the value was never set.

With a bit of uncertainty and hesitancy, I added another condition `|| targetValue=='.'` . Then I build the source code and launched storybook to try it out. 

Guess what? It worked! After verifying this fix with the test suits, I created a PR to arco.
![](https://i.imgur.com/LOUndqa.png)




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
