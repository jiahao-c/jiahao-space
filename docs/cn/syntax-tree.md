# 自然语言句法树编辑器

## 项目背景

我大一的时候选修了 《语言学导论》 (Introduction to Linguistics) 这门课。在这门课上，我了解到，现代语言学之父 Noam Chomsky 提出的一个重要理论是 “生成式语法”，简单来说，他认为人类语言不是一维的，而是有着内在结构的。这一思想主导了近几十年来自然语言句法学 (Syntax) 的发展。

长话短说，在语言学的学习过程中，大家经常会需要画 “句法树” 这个东西。多年以来，这门课的教授都推荐用下图中[这个网站](https://mshang.ca/syntree/)来画句法树图：

![](/img/syntax_tree_gen.jpeg)

但我觉得这个工具并不好用，特别是当句法树比较大时，看着一长串需要编辑的方括号，眼花缭乱。

于是我试着在网络上搜索，看看有没有类似 draw.io 这样可交互的画图工具，能用来画语言学句法树。可惜，怎么找都没有。教授也说他没看到过这样的工具。

于是，我萌生了自己写一个这样工具的想法。

## 第一版

当时我还是个前端小白，没有接触过 react 等现代框架。于是，在网上搜到 D3.js 这个画图工具后，我打算用 jQuery 和 D3.js 来写出这个工具。硬磕了一个月后，终于写了出来：

工具链接：https://jiahao-c.github.io/EasySyntaxTree/
项目代码：https://github.com/jiahao-c/easysyntaxtree

虽然当时前端水平很菜，项目代码几乎全部放在了一个 400 多行的 js 文件里，甚至连工具栏的几个图标都对不齐，但当最终写完，实现了在一个 `<svg>` 里通过 d3 来可视化节点添加、编辑、删除、拖拽、SVG/PNG 导出 等功能的那一刻，还是非常兴奋和有成就感的。我再也不用盯着一堆方括号练习视力了！

![](/img/estv1.gif)


## 第二版

后来，大三时，我又选修了《句法学进阶》这门课。那时我已经接触过 React，于是打算重新写一版这个工具，补充一下之前缺失的功能，例如 json 导入导出等，免得每次想改画好的图时，又得从头开始重新画。在调研了几个不同的画图库时候，我选择了来自 Airbnb 的 visx，然后断断续续用了一个多月完成了这一版 （主要是当时一边实习、一边上网课， 每天能拿来写 side project 的时间确实很少 😂。

![](/img/estv2.png)


## 开发过程中学到的东西

### “点击空白处” 事件
在 ESTv2 中，我们希望用户在编辑完一个节点后，可以直观地通过点击空白处来退出编辑模式。那么，onClick 应该放在哪里呢？

我的解决方案是把它放在整个 svg 元素上：
![](https://i.imgur.com/qv1Z8Gr.png)

然后，对 svg 里的所有 elements 的事件处理时都加上 `stopPropgation()`，避免 bubble 到最外层的 svg 上。
![](https://i.imgur.com/YD0Xxn5.png)


后来，我意识到，“点击周围空白处” 其实是个很常见的事件需求。例如 arco 的 `<Modal>` 组件，默认也启用了 `maskClosable` 属性，使得“点击遮罩”时可以关闭 Modal。

```jsx showLineNumbers
const maskClickRef = useRef(false);

const onClickMask = (e) => {
    if (!maskClickRef.current) return;
    maskClickRef.current = false;
    if (!inExit.current && maskClosable && mask && e.target === e.currentTarget) {
      setTimeout(() => {
        onCancel();
      }, 100);
    }
  };
```

这个 onClick 事件，也是放在 Modal 外层 div 上的：

```jsx
onClick={onClickMask}
```

不过由于咱的句法树编译器在编辑 node 时并不会创建一个 mask ，所以就放外层 svg 上也没啥问题hhh

### 三角形节点

在语法树中，连接 leaf 节点的 edge 除了是直线外，也可能是一个三角形，用于表示 “这部分的内部还有结构，但没有完全展开画出来”。

当用户添加三角形子节点时，会调用 reducer 中的这个 action：

![](https://i.imgur.com/fJLEBfx.png)


然后，dispatcher 会用这个函数来递归查找被点击的节点：

![](https://i.imgur.com/aa51ZG7.png)

当一个节点标记为 `node.triangleChild = true;` 后，在渲染时，我通过 SVG 的 `<Polygon>` 元素，以出三个端点的形式来绘制三角形。

```jsx showLineNumbers
//if the edge is a triangle
if (link.source.data.triangleChild) {
    let halfTextWidth = calcHalfTextWidth(link.target.data.name);
    return (
        <Polygon
        key={i}
        sides={3}
        size={20}
        points={
            [[link.source.x,link.source.y + 8],
            [link.target.x - halfTextWidth - 5,link.target.y - 15],
            [link.target.x + halfTextWidth + 5,link.target.y - 15]]
        }
        fill={"white"}
        stroke={"black"}
        strokeWidth={1}
        />
    );
} 
```

终于，一个三角形节点就可以被画出来了：

![](/img/node-with-triangle.png)

#### 计算文字长度

上文中计算三角形底边的长度时，用到了一个 `calcHalfTextWidth()` 函数。这个函数的来历颇为曲折：

在语言学句法树的规范里，三角形节点底边的长度，应该是跟文字的宽度相等的。那么如何获取 SVG 中 一个 text 元素的实际宽度呢？我最初的尝试是：

```jsx showLineNumbers
export function calcHalfTextWidth(id) {
  let textElement = document.getElementById(id.toString());
  return textElement.getBBox().width / 2;
}
```

可这很明显行不通。因为当这个函数运行时，它想要 `getElementById` 的文字元素**只存在于 React Virtual DOM，还没渲染到真正的 DOM 上**。因此会报这个错：

![](https://i.imgur.com/0lPjVsQ.png)

那这该怎么办呢？ 我考虑过其他方法，比如仅根据字符串长度和字体大小估算文本长度。但还是不够准确。幸运的是，最后我想到了一个神奇的主意：隐形节点。
![](https://i.imgur.com/3HZEa3E.png)

通过在 `document.body` 上插入一个 `visibility: hidden` 的 span，然后通过 `clientWidth` 获取实际的宽度，再瞬间删掉这个元素，就可以获得一段文字在 DOM 上实际渲染出来时的宽度了。

#### 回看

后来，当我更深入地学习 react 之后，我意识到，其实这个问题可以用 `ref` 来解决。

不过，我们肯定不能像下面这样直接在循环里创建一堆 ref。因为 hooks 必须在组件的 top-level 调用。循环、条件、map() 里都是不行的。

```jsx
  // 这样行不通
  {treeNodes.forEach((node) => {
    const ref = useRef(null);
    return <text ref={ref}> {node.data.name} </text>;
  })}
```

还好，React 提供了另一种方案，叫 **ref callback**，它正好适用于我们的使用场景。
![](/img/ref-callback.png)
ref 里存的不是单个 text node，而是用 object 的方式存所有 text node 的 ref，再用另一个 object 来存所有 id-width 的 mapping，像是这样：

```jsx showLineNumbers
const refs = useRef({});
const [width, setWidths] = useState({});

useEffect(()=>{
  const newWidths = {};
  tree.descendants().forEach( node => {
    const nodeDOMElement = refs.current[node.data.id]
    if (nodeDOMElement) {
      newWidths[node.data.id] = nodeDOMElement.getBBox().width;
    }
  })
  setWidths(newWidths);
},[tree])
```

然后在 text 的 jsx 上加上 callback ref:
```jsx
<text
  id={node.data.id!.toString()}
  ref={ node => {refs.current[node.data.id] = node} }
  // 省略其他props
>
  {node.data.name}
</text>
```


###  Immutability

上文中提到了 immutability，这是我最喜欢的函数式编程思想之一。

在 JavaScript 中，对象属性是 mutable 的。但可变意味着容易出错，也不适合搭配 reducer 使用。

因此我在此项目中，通过 immer 实现了这个特性。 Immer 是一个 JavaScript 库，可以方便地处理 immutable state。代码里所有用于 tree operations 的 mutable function，我都会用 immer 的 produce 包起来，得到一个 immutable 版本。

![](https://i.imgur.com/GlRUQsO.png)

这样我就可以很容易地使用这些 immutable functions。

![](https://i.imgur.com/zEjROXp.png)

而且，immutability 意味着没有 side effect，所以我可以用 reducer 轻松实现撤销 / 重做功能：

![](https://i.imgur.com/UCGlk62.png)

### Linear Regression

想要一个美观的树图， svg 得有合适的高度，否则就可能会变成这样：

![](https://i.imgur.com/WseMJZN.png)
![](https://i.imgur.com/a3Gv8hS.png)

怎么计算 svg 最佳的高度呢？首先，我搞了两个滑块，手动微调，对不同的 “树深” （1 到 16）进行了实验。（d3-hierarchy 自带 `HierarchyPointNode.depth`，可以很方便地获取树深）。然后，记录下不同“树深”的情况下最美观的 height 值。

![](https://i.imgur.com/gnSiLXX.png)

![](https://i.imgur.com/mFVwzHx.png)

然后，通过在表格软件里生成一个 Linear Regression， 我找到了 best-fit line：`SVGHeight = 45 * treeDepth + 150`.

![](https://i.imgur.com/p8R41dW.png)

于是， 这个简单的公式就被用来计算默认的 SVG 高度了。当然，用户还是可以通过滑条来手动调节。
