---
sidebar_position: 1
---

# 开源贡献

## arco-design

### 小数点 bug
一开始，我在 issue 里看到了有人提了一个很神奇的 bug： 在 `InputNumber` 组件里输入 1.1，然后把整数位的1删掉之后，剩下一个小数位的 1 删不掉。

![](https://i.imgur.com/rcBN1FR.png)

我用 issue 里 codesandbox 链接复现了下，确实存在这个问题。可是为啥呢？精度问题？ formatter 问题？好像没法一眼看出来。

由于 codesandbox 里的代码有点杂，我先试着创建了一个 **最小复现代码块**。我发现，即使完全不加 props，（即只用 `<InputNumber/>`），问题依然存在。那么首先可以排除 prop 传错的问题。

通过读 `InputNumber` 组件的代码对输入的处理流程，我发现，输入字符串在被设置为值之前会经过以下几步：

![](https://i.imgur.com/dZc1hqX.png)

1. `s.trim()`
2. `s.replace()`
3. `parser(s)`
4. `isNumber(+s)`
5. `getLegalValue(s)`

所以问题很可能出在这些步骤中的某一步，对吧？

于是我开始逐个检查这些 methods，看看有没有写错的/顺序不对的地方。可是，全都过了一遍之后，我还是没在这些 methods 和其 dependency methods 中发现任何问题。那会是什么地方出了问题呢？

于是我重新仔细读了下组件代码，希望能有灵感。研究了半小时之后，我明白了。

原来，当 `targetValue` 为 `.` 时，if 语句中的所有条件都不会为 `true`。所以当用户试图把输入框里的东西删到只剩一个小数点的时候，if block 里的所有东西，包括 `setValue()` ，压根就不会被运行，因此就表现为 “输入框里的东西删不掉”。

于是，我试着在 if 语句中添加了另一个条件 `|| targetValue=='.'`。然后 build 项目并打开 storybook 来看看修好没有。

您猜怎么着？真就修好了！于是在跑完测试，确定没有其他问题后，我提了 PR，也被成功 merge 了。

![](https://i.imgur.com/LOUndqa.png)


### Tooltip 箭头边框错误
也是在 issue 里看到了一个奇怪的问题：在 Tooltip 组件里，放大后可以注意到箭头的边框位置不对。

![](https://i.imgur.com/3RfMGyY.png)


<div align="center" style={{display: 'flex'}}>
<img src="https://i.imgur.com/Jxqnei2.png" width="200"/>
<img src="https://i.imgur.com/6eKtshd.png" width="200"/>
</div>


首先，arco 里的 Tooltip 组件是用 Trigger 组件实现的。因此，咱可能得把这两个组件都看看，来找到问题出在哪。

![](https://i.imgur.com/vg45PtT.png)

既然是样式问题，DevTools 就很有用。我首先在 DOM 中定位了箭头的具体 div。
![](https://i.imgur.com/AR1AFle.png)

我们可以看到，当箭头位置（传入的 prop）为 `top` 时，箭头 div 的 Applied style 是：

```less
border: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3')
// highlight-start
border-top: none;
border-left: none;
// highlight-end
```

但预期的 style 其实应该是：

```less
border: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3')
// highlight-start
border-bottom: none;
border-right: none;
// highlight-end
```

再写的更精确一点的话，上下左右的 border 分别应该是：

```less
border-top: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3')
border-left: @border-1 solid var(~'@{arco-cssvars-prefix}-color-neutral-3')
border-bottom: none;
border-right: none;
```

![](https://i.imgur.com/RMsVrqP.png)

找到了问题，该找原因了。通过查看 `Tooltip` 的样式，我们可以看到截图中的第一和第二块规则分别来自 `ToolTip` 和 `Trigger`：

`components/Tooltip/style/index.less`
![](https://i.imgur.com/3kdKgzz.png)

`components/Trigger/style/index.less`
![](https://i.imgur.com/52WOcnd.png)

于是我们可以得知，出问题的原因是：

`Trigger` 中第 38~39 行的规则本应生效，但由于其优先级低于 `Tooltip` 中的规则，所以没有生效。而 `Tooltip` 并没有像 Trigger 那样处理不同的箭头位置，导致了我们观察到的样式问题。

要修复这个问题，组件得在不同 `position` 下分别处理 `border`才行。不过，我对 less 不太熟，所以我看了下编译出来的 `arco.css`，来帮助自己理解 less 语法的作用。

![](https://i.imgur.com/y1vazIC.png)

通过对比 `Tooltip` 的 less 文件中 `trigger-placement`的用法，以及其编译后的 css，我想到了两种不同的修复方式：

1. 像第 3 行的 trigger-placement 属性一样，把 position 属性和值加到第十一行的 `arco-tooltip-arrow` 上。

```html showLineNumbers
<!-- highlight-start -->
<span
  class="arco-trigger arco-tooltip arco-trigger-position-bottom zoomInFadeOut-appear-done zoomInFadeOut-enter-done"
  trigger-placement="bottom"
>
<!-- highlight-end -->
  <div class="arco-tooltip-content arco-tooltip-content-bottom" role="tooltip">
    <div class="arco-tooltip-content-inner">Mouse over to display tooltip</div>
  </div>
  <div class="arco-trigger-arrow-container arco-tooltip-arrow-container">
    <!-- highlight-start -->
    <div
      class="arco-trigger-arrow arco-tooltip-arrow"
      position="bottom"
    ></div>
    <!-- highlight-end -->
  </div>
</span>;

```

2. 复用 `trigger-placement` 的信息

我最终选择了方案 2， 在 less 里处理这个问题：

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

试了下这个方案，搞定！
![](https://i.imgur.com/8cduyJI.png)

于是提了 PR，也顺利合并了～
![](/img/tooltip-pr.png)


### Select 闪动报错

我看到有人提了个 issue，反馈了这样一个奇怪的问题，说在 Select 里如果快速输入，就会有个 "no data" 的提示闪出来一下，如果慢速输入就没问题。

![](/img/issue-1156.png)
![](/img/issue-1156.gif)

一开始 arco 团队的人看了眼，但是没法复现。于是我研究了下，发现是因为这个 bug 只能在 Next.js 里复现。

这个 "no data" 是个占位组件，理论上应该只在没有 Option 的情况下出现，但是它在不该出现的时候出现了。那么，应该就是判断它出现的条件出了问题。在 Select 组件源码中找到这一段逻辑：

```jsx
  // 无选项时的占位符元素
    const eleNoOptionPlaceholder = mergedNotFoundContent ? (
        <div
        style={dropdownMenuStyle}
        className={cs(`${prefixCls}-popup-inner`, dropdownMenuClassName)}
        >
        {mergedNotFoundContent}
        </div>
    ) : null;
```

我们可以看到，判断它出现的唯一条件是 `mergedNotFoundContent`。再看组件里其他源码，我们可以看到，在 input 改变时，代码会检查 `allowCreate` ，并做处理（如果 allowCreate 是 true，意味着用户可能是在创建新选项，这个情况下 mergedNotFoundContent 确实可能不为 null）。

![](/img/allow-create.png)

因此，在判断是否应该显示占位组件时，我们还应该确保 `allowCreate` 是 `false`。由此我们就得到了最终的 fix:

![](/img/pr-1184-diff.png)

经过测试，确实解决了问题，于是提了 PR，顺利 merge ～

### ColorPicker 实现 disabledAlpha

看到一个 issue，说 `ColorPicker` 里 `disabledAlpha` 这个功能用不了。

![](/img/issue-2528.png)

一开始我还以为是什么 bug，结果看了下组件代码，发现这功能虽然在文档里写了，但代码里压根就没实现😂。 

于是我问了下 arco，看看能不能交给我实现，并提了计划实现方案。

![](/img/comm-2528.png)

经过沟通，arco 希望在这种情况下直接隐藏掉（而不是 disable 掉） Alpha 数值框，于是我就按官方意见写了实现。

![](/img/pr-2538.png)

除了功能本身的实现之外，我也补充了这个 API 的文档、测试的快照、以及更新了 storybook，最后也顺利 merge 啦～

![](/img/diff-2538.png)

### TS 类型错误

我在 myExams2 项目中使用 arco-design 时遇到了个 Type Error。经过测试和查文档，我确定 `mode` 的有效值还包括 `'top'` 和 `'bottom'`，并且当 `direction === 'horizontal'` 时，默认值应为 `top`。只是类型定义里忘写了。

![](https://i.imgur.com/hGyNA1g.png)

于是也通过一个 PR，修好了这个类型定义问题～
![](https://i.imgur.com/A9lnQCz.png)

### Select.Option API 优化

当我使用 arco 的 `Select.Option` 组件时，发现它要求必须有 children 节点，怪麻烦的。明明 prop 里已经能传value 了，而且大部分时候（不考虑i18n的情况下），value 就是 option 需要显示的内容。那 children 应该是 optional 才对嘛。

于是，我征求了 arco 团队的意见，得到同意后，用 Nullish 合并运算符（??）创建了 PR，这样 children 节点就是 optional 的了～

![](https://i.imgur.com/ReXqvHz.png)
![](https://i.imgur.com/ZZ8sxx3.png)

## Atlaskit

Atlaskit 是 Atlassian Design System 的别称，是 Atlassian 出品的开源 React 组件库，我在 Atlassian 写的所有前端项目都会用到这个组件库。

### 悬浮侧边栏异常关闭

有次在用 Tooltip 组件时，我发现了一个 bug: 当鼠标悬停在 [Side Nav](https://atlassian.design/components/navigation-system/layout/examples#side-nav-flyout) 组件里的 Tooltip 提示上时，这个 Side Nav Flyout 会意外关闭。

![](/img/tooltip.png)

Side Nav Flyout 的预期行为是：当用户鼠标悬浮在侧边栏的“展开”时，无需点击，侧边栏就会自动“飞出来”，如果移开鼠标，侧边栏就会自动收起来。

但bug中实际发生的行为是：如果用户触发了侧边栏内某个tooltip，并将鼠标移到tooltip上，侧边栏就会收起来。


### 修复过程

为什么会发生这个问题呢？我先阅读了 [SideNav 组件](https://bitbucket.org/atlassian/atlassian-frontend-mirror/src/master/design-system/navigation-system/src/ui/page-layout/side-nav/side-nav.tsx) 的源码。

首先，我想弄明白的问题是：什么情况下 SideNav 会关闭？在 SideNav 源码中我发现，“移出鼠标时关闭悬浮窗” 的逻辑是这样写的：

```jsx showLineNumbers
	useEffect(() => {
		// Close the flyout if there are no more layers open and the user is not mousing over the flyout areas
		return openLayerObserver.onChange(
			({ count }) => {
				if (flyoutStateRef.current.type === 'ready-to-close' && count === 0) {
					updateFlyoutState('force-close');
				}
			},
			{ namespace: openLayerObserverSideNavNamespace },
		);
	}, [openLayerObserver, updateFlyoutState]);
```

可以看到，每次 `openLayerObserver` 这个 state 发生变化时，代码会检测 “open layer” 数量。当数量为 0，就关闭 flyout。那么啥是 layer 呢？在组件代码中，可以看到，openLayerObserver 是通过 [useOpenLayerObserver(](https://bitbucket.org/atlassian/atlassian-frontend-mirror/src/master/design-system/layering/src/components/open-layer-observer/use-open-layer-observer.tsx) 这个 hook 获取的。

```jsx
const openLayerObserver = useOpenLayerObserver();
```

通过查文档，我发现，Atlaskit 组件库中的 Layering 是基于 React Context 所实现的 “层级” 概念，在 popup, dropdown 等需要 “覆盖在其他组件上面的” 组件中都会用到，方便每个组件获取正确的 `zIndex`。

```jsx
export function useOpenLayerObserver() {
	const context = useContext(OpenLayerObserverContext);
	...
}
```

`OpenLayerObserver` 则是一个 context provider，用一个 ref 来跟踪它下面的 React DOM 里打开的 layered component 的数量。通过它，wrapper component 可以得出自身的 children 里是否有打开的 layering components。

那么，看上去问题就出在 Layering 上。我又阅读了 [Tooltip 组件](https://bitbucket.org/atlassian/atlassian-frontend-mirror/src/master/design-system/tooltip/src/tooltip.tsx) 的源码，发现它是用 [react-popper](https://popper.js.org/react-popper/) 和 [React Portal](https://bitbucket.org/atlassian/atlassian-frontend-mirror/src/master/design-system/portal/src/internal/components/internal-portal.tsx) 来实现的。

```tsx showLineNumbers
shouldRenderTooltipPopup? (
    <Portal zIndex={tooltipZIndex}>
        <Popper 
            placement={tooltipPosition}
            referenceElement={getReferenceElement() as HTMLElement}
            >
        </Popper>
    </Portal>
)
```

所以对于 DOM 来说，它本身不算存在于 “侧边栏” 元素的 children 内。因此，站在侧边栏的角度，它以为鼠标已经移出了 （`即 layerCount === 0`），于是就折叠了起来。

在浏览器 devtool 的 layers 工具中，我们可以看到，tooltip 显示出来时， 浏览器意义上的 layer 数量会加一：
![](/img/layer_console.png)。

可是 `OpenLayerObserverContext` 并不知道这件事，所以我们得 “通知” layer context。正巧，组件库中有个 hook 叫 [useNotifyOpenLayerObserver](https://bitbucket.org/atlassian/atlassian-frontend-mirror/src/master/design-system/layering/src/components/open-layer-observer/use-notify-open-layer-observer.tsx)，它会在组件 mount/unmount 或变得 visible/hidden 时，增加/减少 open layer count，以 “通知” 上层的 `OpenLayerObserver`. 

所以，我们可以在 Tooltip 组件代码里加上对这个 hook 的调用，使得在 tooltip 显示出来的情况下，让它下面 flyout 的侧边栏也锁定在打开的状态。

```tsx showLineNumbers
const shouldRenderTooltipContainer: boolean = state !== 'hide' && Boolean(content);

useNotifyOpenLayerObserver({isOpen: shouldRenderTooltipContainer})
```

加上这一行后，经过测试，可以发现，bug 成功被解决啦！

## svg-cowbar

我在开发 Easy Syntax Tree 时遇到了一个问题，就是导出 PNG 用不了，但导出 SVG 仍然正常。

![](https://i.imgur.com/UKi6U9g.png)

我在 Easy Syntax Tree 用了 “svg-crowbar” 库来处理 SVG/PNG 导出。所以我猜测是库的问题。然后，于是我看了下 browser console：

![](https://i.imgur.com/hcW9ACJ.png)

然后搜了下这个报错，发现问题是由于 JavaScript 的 base64 编码问题导致的。MDN 上有推荐的解决方案：

![](https://i.imgur.com/nYWpAfP.png)

于是我向该库提交了 issue：

![](https://i.imgur.com/x3SCSkA.png)

然后，按照 MDN 的说明，我修复了问题，提交并 Merge 了 PR：

![](https://i.imgur.com/Reos4wy.png)
![](https://i.imgur.com/7TIU9Qv.png)
