# 自然语言句法树编辑器

## 项目背景

我大一的时候选修了 《语言学导论》 (Introduction to Linguistics) 这门课。在这门课上，我了解到，现代语言学之父 Noam Chomsky 提出的一个重要理论是 “生成式语法”，简单来说，他认为人类语言不是一维的，而是有着内在结构的。这一思想主导了近几十年来自然语言句法学 (Syntax) 的发展。

长话短说，在语言学的学习过程中，大家经常会需要画 “句法树” 这个东西。多年以来，这门课的教授都推荐用下图中[这个网站](https://mshang.ca/syntree/)来画句法树图：

![](/img/syntax_tree_gen.jpeg)

但我觉得这个工具并不好用，特别是当句法树比较大时，看着一长串需要编辑的方括号，眼花缭乱。

于是我试着在网络上搜索，看看有没有类似 draw.io 这样可交互的画图工具，能用来画语言学句法树。可惜，怎么找都没有。教授也说他没看到过这样的工具。

于是，我萌生了自己写一个这样工具的想法。

## 第一版

当时我还是个前端小白，没有接触过 react 等现代框架。于是，在网上搜到 D3.js 这个画图工具后，我打算用 jQuery 和 D3.js 来写出这个工具。同时，因为没有可以参考的项目，所以交互方式也都是自己设计。在硬磕了一个月后，终于写了出来：

工具链接：https://jiahao-c.github.io/EasySyntaxTree/
项目代码：https://github.com/jiahao-c/easysyntaxtree

当时遇到的有三个主要难点，首先是句法树图形的绘制。当时我尝试了之后发现，d3内置的树图，没有办法实现语言学句法树所需要的那种严格的样式要求。所以我只能自己写算法来实现计算每个节点和连接线的坐标。拿节点来说吧，Y还好，直接看这个节点在树中的高度，但是X的话，就得根据每个子节点的X加起来再除以子节点数量，这样确保父节点在所有子字节点正上方的中间。然后计算连接线的坐标，不仅得考虑父节点子节点的坐标，还得考虑文字的宽度，这样才能保证这个点刚好落在文字的中间。

第二个是实现任意节点的编辑。我一开始设计的句法树的序列化里面，只存节点内容和children，但是这样点击的时候没法定位到，所以，我每次渲染点，先给每个节点生成id，id是行序遍历的index。然后onclick的时候，把id传过去，根据ID来定位节点，然后更新数据。

第三个是实现拖拽的方式交换任意两个子树。首先开始拖拽的时候，这个子树就要从原本的树上脱离下来，并且拖拽过程中字树得跟着鼠标移动，所以要根据鼠标位置实时计算这个子树节点和连接线的坐标，最后鼠标悬停在目标节点位置的时候，还得做一个距离检测或者说碰撞检测，最终当鼠标松开的时候，再进行实际的数据交换。

交换过程中，我会把原来子树和目标子树都先flatten成为一个一维数组，这块我用了一个前序遍历，把里面所有的节点都提出来，同时也保留children信息。

### 数据存储结构
```javascript
[
  {
    text: "TP",
    children: [
      {
        text: "NP",
        children: [
          {
            text: "Det",
            children: [{ text: "a", children: [] }],
          }
          {
            text: "N",
            children: [{ text: "linguist", children: [] }],
          }
        ]
      }
]
```

flatten 后的结构：

```javascript
[
  { text: 'TP', children: [ [Object], [Object] ] },
  { text: 'NP', children: [ [Object], [Object] ] },
  { text: 'Det', children: [ [Object] ] },
  { text: 'a', children: [] },
  { text: 'N', children: [ [Object] ] },
  { text: 'linguist', children: [] },
]
```


### 回看第一版代码
虽然当时前端水平很菜，项目代码几乎全部放在了一个 400 多行的 js 文件里，甚至连工具栏的几个图标都对不齐，但当最终写完，实现了在一个 `<svg>` 里通过 d3 来可视化节点添加、编辑、删除、拖拽、SVG/PNG 导出 等功能的那一刻，还是非常兴奋和有成就感的。我再也不用盯着一堆方括号练习视力了！

![](/img/estv1.gif)


## 第二版

后来，大三时，我又选修了《句法学进阶》这门课。那时我已经接触过 React，于是打算重新写一版这个工具，补充一下之前缺失的功能，例如 json 导入导出等，免得每次想改画好的图时，又得从头开始重新画。在调研了几个数据可视化 library 之后，我选择了来自 Airbnb 的 visx，然后断断续续用了一个多月完成了这一版 （主要是当时一边实习、一边上网课， 每天能拿来写 side project 的时间确实很少 😂。

![](/img/estv2.png)


## 开发过程中学到的东西

### 数据存储与 undo/redo

先定义一个 TreeNode，然后整个树的数据以下面 `StateType` 的方式存储，其中包含两个数组： past 和 future，保留编辑历史。

```typescript
export interface TreeNode {
  name: string;
  children: TreeNode[];
  id?: number;
  triangleChild?: boolean;
}

export interface StateType {
  tree: TreeNode;
  operatingNode: HierarchyPointNode<TreeNode> | null;
  inputAvailable: boolean;
  past: TreeNode[];
  future: TreeNode[];
}
```

在 reducer 中，每次 UNDO，就从 past 数组中取出最后一个元素，作为新的 tree 渲染出来，并把当前的树放进 future 数组里。而每次 REDO，则从 future数组中取出最后一个元素，并把当前的树放进past 数组里。

```
    case actions.UNDO:
      return {
        ...state,
        future: [...state.future, state.tree],
        tree: state.past.pop()!
      };
    case actions.REDO:
      return {
        ...state,
        past: [...state.past, state.tree],
        tree: state.future.pop()!
      };
```

### 三角形节点

和常规的树图不同，在语法树中，连接 leaf 节点的 edge 除了是直线外，也可能是一个三角形，用于表示 “这部分的内部还有结构，但没有完全展开画出来”。

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

### 计算底边长度

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

### 回看文字长度计算

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

上文中提到了 immutability，这是我最喜欢的函数式编程思想之一。在 JavaScript 中，对象属性是 mutable 的。但可变意味着容易出错，也不适合搭配 reducer 使用。

因此我在此项目中，通过 immer 实现了这个特性。 Immer 是一个 JavaScript 库，可以方便地处理 immutable state。代码里所有用于 tree operations 的 mutable function，我都会用 immer 的 produce 包起来，得到一个 immutable 版本。

![](https://i.imgur.com/GlRUQsO.png)

这样我就可以很容易地使用这些 immutable functions。

![](https://i.imgur.com/zEjROXp.png)

而且，immutability 意味着没有 side effect，所以我可以用 reducer 轻松实现撤销 / 重做功能：

![](https://i.imgur.com/UCGlk62.png)


### 原地文本框

在用 d3 实现的的第一版里，每个节点的文本编辑是 in-place 的。当一个双击事件被触发时，先用 `getBoundingClientRect` 拿到 node 的尺寸和位置，然后通过 `position: absolute` （最近的已经定位的祖先元素，即svg container） 以及 `left` 和 `top` 放一个 `<input>` 在相同的位置，再把节点里原本的 text 放到 input 的 value里，就可以实现 “双击直接原地编辑”了。

```javascript
function editText(node) {
    let boundingRect = document.getElementById(node.id).getBoundingClientRect();
    let activeInput = d3.select('#textEdit')
        .append("input")
        .classed("overlay-input", true)
        .attr("type", "text")
        .attr("value", node.text)
        .style("color", "red")
        .style("background", "white")
        .style("font-size", fontSize + "px")
        .style("left", boundingRect.left + "px")
        .style("top", boundingRect.top + "px")
        .style("width", "80px")
        .on("keypress", (item, index, element) => { //Press space to finish editing
            if (d3.event.keyCode === 32 || d3.event.keyCode === 13) {

                node.text = element[0].value;
                renderSVG(renderTarget);
                element[0].remove();
            }
        });
    activeInput.node().focus();
}
```

而在用 visx 实现的第二版中，这个功能是通过 React Portal 实现的，具体步骤如下：

首先，先用 `getBoundingClientRect` 得到整个svg的位置。
      
```jsx
const svgRect = svgRef.current.getBoundingClientRect()
```

再通过 id 从 visx 数据模型中找到被编辑的 node 的 x 和 y 坐标，进行计算，存下位置

```jsx showLineNumbers
const editingNode = data.descendants().find((node: any) => node.data.id === editingNodeId);
const fixedPositionX = svgRect.left + margin.left + nodeWithPosition.x;
const fixedPositionY = svgRect.top + margin.top + nodeWithPosition.y;
setPosition({ x: fixedPositionX, y: fixedPositionY });
```

最后，用portal把它放到body里，同时用 fixed 定位和很大的 zIndex 让它显示在正确的位置：

```jsx showLineNumbers
  return createPortal(
    <input
      ref={inputRef}
      type="text"
      value={editText}
      onChange={(e) => setEditText(e.target.value)}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        boxSizing: 'border-box'
      }}
    />,
    document.body
  );
};
```



### 回看框架选择

在2021年写这个项目的时候，还没有 React flow 这种 Node 和 Edge 概念很清晰的、自带拖拽功能、原地编辑功能的，专门用于编辑 Graph 图的框架。因此当时选择了 Visx。但 visx 其实更适合静态的、通用的 “数据可视化”，例如绘制扇形、条形、折线等各种统计图，而不那么适合做树图编辑器。如果将来有精力，我应该会改用 React flow 做一版更好用的，功能更全面的编辑器～