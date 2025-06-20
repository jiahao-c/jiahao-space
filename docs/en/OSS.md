---
sidebar_position: 2
---

# Learning from OSS Contributions

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


### Tooltip Arrow Wrong Border 
I came across this issue on Github.

![](https://i.imgur.com/3RfMGyY.png)

When we zoom in, we can notice the the border of the arrow is not where it should be.

<div align="center" style={{display: 'flex'}}>
<img src="https://i.imgur.com/Jxqnei2.png" width="200"/>
<img src="https://i.imgur.com/6eKtshd.png" width="200"/>
</div>

Although this is only a minor styling issue, it would still be nice to get it fixed. 

The first thing I noticed: The Tooltip component is implemented using the Trigger component. Therefore, I kept in mind that I might need to look at both components to rule out the root of the problem.

![](https://i.imgur.com/vg45PtT.png)

Since it's a styling issue, DevTools can come in candy. I first identified the exact div for the arrow in the DOM. 
![](https://i.imgur.com/AR1AFle.png)

We can see that, when the arrow position (passed in prop) is `top`, the applied style of the arrow div is 
```less
border: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3')
border-top: none;
border-left: none;
```



But the expected style should actually be

```less
border: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3')
border-bottom: none;
border-right: none;
```
Or, more precisely,

```less
border-top: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3')
border-left: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3')
border-bottom: none;
border-right: none;
```

![](https://i.imgur.com/RMsVrqP.png)

So how did this happen? By looking at the styling of `Tooltip`, we can see that the first and the second block of rules in the screenshot came from `ToolTip` and `Trigger` accordingly:

`components/Tooltip/style/index.less`
![](https://i.imgur.com/3kdKgzz.png)

`components/Trigger/style/index.less`
![](https://i.imgur.com/52WOcnd.png)

Now, the root cause is quite clear:

The rule on line 38~39 in `Trigger` should apply, but it was not, due to the lower specificity than the rules in `Tooltip`. But the `Tooltip` did not handle different arrow positions like Trigger did, resulting in the styling issue we observed.

Now to fix this problem, I should update the code to handle `border` in different `position`. I'm new to less, so I monitored the `arco.css` in the built file to help me understand the less files.

![](https://i.imgur.com/y1vazIC.png)

By observing how `Tooltip` uses the property `trigger-placement` in `css` and its complied `css`, I had two ideas: 

1. Add the position prop and value to `arco-tooltip-arrow` (Line 11), just like trigger-placement (Line 3).

```html=
<span
  class="arco-trigger arco-tooltip arco-trigger-position-bottom zoomInFadeOut-appear-done zoomInFadeOut-enter-done"
  trigger-placement="bottom"
>
  <div class="arco-tooltip-content arco-tooltip-content-bottom" role="tooltip">
    <div class="arco-tooltip-content-inner">Mouse over to display tooltip</div>
  </div>
  <div class="arco-trigger-arrow-container arco-tooltip-arrow-container">
    <div
      class="arco-trigger-arrow arco-tooltip-arrow"
      position="bottom"
    ></div>
  </div>
</span>;

```

2. Reuse the information from `trigger-placement`. 

I went ahead with Option 2, and produced this style rule:

```less
.@{prefix}-trigger {

  &[trigger-placement='top'] .@{prefix}-trigger-arrow.@{prefix}-tooltip-arrow,
  &[trigger-placement='tl'] .@{prefix}-trigger-arrow.@{prefix}-tooltip-arrow,
  &[trigger-placement='tr'] .@{prefix}-trigger-arrow.@{prefix}-tooltip-arrow {
    border-bottom: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3');
    border-right: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3');
  }

  &[trigger-placement='bottom'] .@{prefix}-trigger-arrow.@{prefix}-tooltip-arrow,
  &[trigger-placement='bl'] .@{prefix}-trigger-arrow.@{prefix}-tooltip-arrow,
  &[trigger-placement='br'] .@{prefix}-trigger-arrow.@{prefix}-tooltip-arrow {
    border-top: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3');
    border-left: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3');
  }

  &[trigger-placement='left'] .@{prefix}-trigger-arrow.@{prefix}-tooltip-arrow,
  &[trigger-placement='lt'] .@{prefix}-trigger-arrow.@{prefix}-tooltip-arrow,
  &[trigger-placement='lb'] .@{prefix}-trigger-arrow.@{prefix}-tooltip-arrow {
    border-top: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3');
    border-right: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3');
  }

  &[trigger-placement='right'] .@{prefix}-trigger-arrow.@{prefix}-tooltip-arrow,
  &[trigger-placement='rt'] .@{prefix}-trigger-arrow.@{prefix}-tooltip-arrow,
  &[trigger-placement='rb'] .@{prefix}-trigger-arrow.@{prefix}-tooltip-arrow {
    border-left: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3');
    border-bottom: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3');
  }
}
```

This fixed the problem.
![](https://i.imgur.com/8cduyJI.png)



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
