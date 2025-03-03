---
sidebar_position: 5
---

# 字节前端青训营
在[字节前端青训营](https://youthcamp.bytedance.com/) 学到的部分知识总结：


## 前端设计模式
### JS
组件设计基本步骤：
1. 结构设计（html）
2. 展示设计（css）
3. 行为设计（js）： API「功能」+Event「控制流」
组件封装基本步骤：
1. 插件化
2. 模版化
3. 抽象化

## 性能优化
### 网络优化 / 资源优化
- CDN
- 压缩
- http2
- 图片/字体加载
- HTTP缓存
- KeepAlive
- SSR
### 应用优化
- 代码拆分
- 按需加载
- 持久化缓存

### 体验优化
- 骨架屏

## 安全
- XSS
- CORS
    - CSP(Content Security Policy)
    - SameSite Cookie 
- SQL 注入
- SSRF
- HTTPS

## 工程化
- 打包工具（bundle）：webpack、vite、esbuild、parcel
- 代码压缩（uglify）：uglifyjs
- 语法转换（transpile）：bablejs、typescript


## CSS
### 属性计算过程
1. 声明值：通过选择器匹配，属性有效，符合当前的media等规则进行筛选（filtering），得到一个元素的声明值，这时候这个元素的某个属性可能有0到多个声明值。
2. 层叠值：通过来源，选择器的特异性，书写顺序等选出优先级最高的层叠值。
3. 指定值：当层叠值为空的时候，这时候就使用继承值或者默认值。
4. 计算值：将一些相对值或者关键字转成绝对值，比如em转成px，相对路径变成绝对路径。
5. 使用值： 进行实际布局时使用的值，不会再有相对值或者关键字。比如400.2px
6. 实际值：小数转整数

### 布局
#### display
block, inline, inline-block, flex, grid, none

#### position
- relative: relative to position in normal flow
- absolute: out of normal flow, like own layer
（相对于最近的非static 祖先定位，脱离常规流）
- fixed: like absolute, but relative to viewport (instead of page)
- sticky: act like static until hits defined offset

#### 布局方式
常规流、浮动、绝对定位

#### 两种 box-sizing
```
border-box //宽高是border+padding+content
content-box //宽高是 content
```

### 选择器
标签，id，类，伪类，属性
