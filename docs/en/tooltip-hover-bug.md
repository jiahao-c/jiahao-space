# Fixing tooltip that closes side nav

![](/img/tooltip.png)

When placing mouse on a tooltip inside a side nav flyout (drawer), the flyout closes unexpectedly.

## Why this happens
[@atlaskit/tooltip](https://bitbucket.org/atlassian/atlassian-frontend-mirror/src/master/design-system/tooltip/src/tooltip.tsx) uses [react-popper](https://popper.js.org/react-popper/) wrapped in a [React Portal](https://bitbucket.org/atlassian/atlassian-frontend-mirror/src/master/design-system/portal/src/internal/components/internal-portal.tsx), so it does not count as being within the "side nav" element in browser DOM.

```tsx
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

## How this was fixed.

We have a React hook `useNotifyOpenLayerObserver` that increments/decrements the open layer count when component mounts/unmounts or become visible/hidden. It's used to "notify" the layer observer that a new layer has been added/opened.


```tsx showLineNumbers
const shouldRenderTooltipContainer: boolean = state !== 'hide' && Boolean(content);
useNotifyOpenLayerObserver({isOpen: shouldRenderTooltipContainer})
/* As long as this tooltip is open, we want to notify the open layer should stay open  */
```
