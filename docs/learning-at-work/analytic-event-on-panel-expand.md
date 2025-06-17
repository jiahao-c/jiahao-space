## Analytic event on panel expand


```javascript
const toggleButton = document.querySelector('button[aria-label="..."]');
const observerConfig = {attributes: true, attributeFilter: ['aria-expanded']};
const observer = new MutationObserver(()=>{
    if (toggleButton.getAttribute('aria-expanded') === 'false') {
        analytics.sendEvent(...)
    }
})
observer.observe(toggleButton, observerConfig);
```