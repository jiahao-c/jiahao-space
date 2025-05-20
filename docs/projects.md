---
sidebar_position: 1
---

# Learning in side projects
My learnings and takeaways on some interesting stuff I worked on.

## Easy Syntax Tree
### Event Delegation
In ESTv2, a user may intuitively want to exit the edit mode by clicking on the blank space. But, where should the onClick go?

My solution was to put it on the entire svg element:
![](https://i.imgur.com/qv1Z8Gr.png)

Then, I use stopPropgation for events on inner elements.
![](https://i.imgur.com/YD0Xxn5.png)


### Triangle Child
In syntax tree, an edge may be a triangle. Triangles stand for a portion of structure that the tree-drawer doesn’t want to bother drawing out in full.
![](https://i.imgur.com/lwNPIi1.png)
To implement this in ESTv2, we use the SVG `<Polygon>` element, and let browser draw the triangle by giving the three end points.
When the user wants to add a triangle child, this action in the reducer will be called:
![](https://i.imgur.com/fJLEBfx.png)

The dispatcher use the following function to recursively find the clicked node (of course, immer is used for immutability)
    
![](https://i.imgur.com/aa51ZG7.png)
A friendly alert was also added for instant feedback:
![](https://i.imgur.com/v8gcjoz.png)
    
###  Immutability
Immutability is the my favorite thing from Functional Programming. Here I'll explain how I achieves Immutability during data operations with immer in ESTv2.
    
In JavaScript, object properties are mutable. But mutability is prone to errors, and doesn’t fit with reducers.
    
Immer is a JavaScript library that allows you to work with immutable state in a more convenient way. For each mutable function that I have for tree operations, I wrap it using immer produce, then export the immutable version.

![](https://i.imgur.com/GlRUQsO.png)

In this way, I can simply use the immutable function like this:
    
![](https://i.imgur.com/zEjROXp.png)

Also, immutability has no effects — so I can use reducers (as in redux) to create undo/redo functionality with ease:
    
![](https://i.imgur.com/UCGlk62.png)


### Linear Regression
So, a tree canvas needs proper width and height. Otherwise it could look like these:
![](https://i.imgur.com/WseMJZN.png)
![](https://i.imgur.com/a3Gv8hS.png)

How can you calculate the best width and height? I first built two sliders to manually adjust and tune the numbers. Then, I experimented with each tree depth from 1 to 16. (d3-hierarchy comes with HierarchyPointNode.depth, which allows easily getting the depth). The best-looking width and height were recorded.
![](https://i.imgur.com/gnSiLXX.png)
![](https://i.imgur.com/mFVwzHx.png)
Using linear regression, I was able to find a best-fit line: treeCanvasHeight=45*treeDepth +150
![](https://i.imgur.com/p8R41dW.png)

### SVG width
So I need to get the width of an SVG Text Element by its id. My first attempt was:
    
```typescript
export function calcHalfTextWidth(id: number): number {
  let textElement: SVGGraphicsElement = document.getElementById(id.toString());
  return textElement.getBBox().width / 2;
}
```
    
But there’s a type error: TypeScript thinks the return type of getElementById() has to be HTMLElement, which is not the SVGGraphicsElement I declared for this variable. I did some research and found there is no elegant solution to this. The simplest (yet a bit dirty) fix is to convert it to any type:

```typescript
export function calcHalfTextWidth(id: number): number {
  let textElement: SVGGraphicsElement = document.getElementById(id.toString()) as any;
  return textElement.getBBox().width / 2;
}
```
    
Seems good if we were just doing vanilla JS. But in React, there is another problem, because this is how I am going to use this function:

```typescript
<Polygon
sides={3}
size={20}
points={`
  ${link.source.x},
  ${link.source.y + 8} 
  ${link.target.x - 20 - calcHalfTextWidth(6)},${link.target.y - 15} 
  ${link.target.x + 20},${link.target.y - 15}`}
  fill={"white"}
  stroke={"black"}
  strokeWidth={1}
/>
```
    
As you can see, I am using the function inside a prop for SVG Polygon element. The problem is: the `<Text/>` element inside the SVG won’t be rendered in HTML at the time when this function is invoked. The following error will be produced:
    
![](https://i.imgur.com/0lPjVsQ.png)

Will useRef() work? No, because that means to create a ref for every single SVG `<text/>`, which is unrealistic.
So, the question is:
```typescript
function ParentComponent(){
  let largeArray = ['1','2','3','4','5']; //could be much larger 
  return(
    <Child1 someProp={document.getElementById('3')).someProperty}/>
    largeArray.map(i => <Child2 id=i/>)
  )
}
// maybe this?
function ParentComponent(){
  let largeArray = ['1','2','3','4','5']; //could be much larger 
  let isTextRendered = useState(false);
  return(
    isTextRendered?null:<Child1 someProp={document.getElementById('3')).someProperty}/>
    largeArray.map(i => <Child2 id={i} ref={isTextRendered=true; } />)
  )
}


//requires <Child2/> to be rendered to DOM before running the getElementById, otherwise would get the following error:
//Cannot read property "someProperty" of null

//if there's only one <Child2>,  we can do:

function Child2WithRef(props, ref){
  const Child2Ref = useRef();
  useImperativeHandle(ref, () => ({
    getProperty: () => Child2Ref.current.someProperty
  }));
  return <Child2 ref={Child2Ref} {...props} />;
}
Child2WithRef = forwardRef(Child2WithRef);
  
function ParentComponent(){
  const child2Ref = useRef();
  return(
    <Child1 someProp={child2Ref.current.getProperty()/>
    <Child2WithRef ref={child2Ref}/>
  )
}


//but there are lots of <Child2/> since it was mapped from an array! 
//So, how can we solve this?
```
    
As explained in the comment, to calculate the props for `<Child1/>`, we need `<Child2/>` to be rendered to DOM, which defeats the purpose of React Virtual DOM.
    
I considered other methods like estimating the text length solely based on string length and font size. But that may not be accurate enough.
    
Fortunately, In the end, I came up an excellent idea: Invisible node.

![](https://i.imgur.com/3HZEa3E.png)


    
## Portfolio
### Use Antd in Docusaurus
#### Problem
I wanted to use antd for my project page because I like the Card component. But, antd styles are global by default. So when I import antd the regular way, it will pollute the css of my docusaurus theme.
    
#### Solution
We can fix by using a less file that imports antd styles within a declaration. This way the import is scoped.

```css=
.antd-container{
  @import '~antd/dist/antd.less';
  /*other styles...*/
}
```
    
### Docusaurus Routing 
#### Problem
Visiting the project page from homepage button is fine. But visiting directly from the URL `https://jiahao.vercel.app/projects` will result in a 404 error.
![](https://i.imgur.com/SyfO3Ig.png)
    
My first intuition is routing issue. By diving deep into the code, I noticed that my structure is:
    
![](https://i.imgur.com/EdhIYxP.png)

And visiting `https://jiahao.vercel.app/Projects` works fine. Therefore, the root cause is the naming of this folder. 
    
#### Solution  
After renaming the folder to `projects`, problems is resolved.
