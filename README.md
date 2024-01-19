<!--
 * @Author: ChuandongHuang chuandong_huang@human-horizons.com
 * @Date: 2024-01-17 15:44:40
 * @LastEditors: ChuandongHuang chuandong_huang@human-horizons.com
 * @LastEditTime: 2024-01-17 15:46:42
 * @Description:
-->

# Vue3-源码

## 数据响应

### 原理

把一个普通的 JavaScript 对象传入 Vue 实例作为 `data` 选项，Vue 将遍历此对象所有的 属性，并使用 `Object.defineProperty` 中的getter、setter劫持属性

```javascript
let person = {age:18,name:'tom'}
class Observer {
  constructor(data) {
    // 新增一个ob属性，表示已经是响应式数据了，避免重复操作
    // def(data, '__ob__', this);
    if (Array.isArray(data)) {
      // 处理数组逻辑
    } else {
      this.walk(data);
    }
  }
  walk(data) {
    // 获取data中所有的key
    const keys = Object.keys(data);
    keys.forEach((key) => {
      defineReactive(data, data[key], key);
    });
  }
}
function defineReactive(data, val, key) {
  // 如果数据为object,需要再次调用
  if (typeof val === "object") {
    new Observer(val);
  }
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get() {
      console.log("🚀 ~ get ~ val:", val);
      return val;
    },
    set(newVal) {
      if (val === newVal) return;
      console.log("🚀 ~ set ~ newVal:", newVal);
      val = newVal;
    },
  });
}
new Observer(person);
person.age = 20 // 触发set
```

### 依赖

`Vue`中还实现了一个叫做`Watcher`的类，`Watcher`类的实例就是依赖，据变化时，我们不直接去通知依赖更新，而是通知依赖对应的`Watch`实例，由`Watcher`实例去通知真正的视图

```js
// 依赖
class Watcher {
  constructor(vm, exp, cb) {
    this.vm = vm; // vue实例
    this.exp = exp; // key
    this.cb = cb; // 数据变化执行的回调
    this.value = this.get();
  }
  //  获取数据，同时把当前Watcher实例设置为Dep.target，进行依赖收集
  get() {
    Dep.target = this; // 将当前 Watcher 实例设置为全局的 Dep.target
    const value = this.vm._data[this.exp]; // 触发getter，实现依赖收集
    Dep.target = null; // 重置Dep.targe 避免影响其他依赖收集
    return value;
  }
  //  更新方法，数据变化时调用
  update() {
    this.cb();
  }
}
```

### 依赖收集

```js
class Dep {
  constructor() {
    this.subs = [];
  }
  // 添加依赖
  addSub(sub) {
    this.subs.push(sub);
  }
  removeSub(sub) {
    this.remove(this.subs, sub);
  }
  // 通知依赖更新
  notify() {
    const sub = this.subs.slice();
    for (let i = 0; i < subs[i].length; i++) {
      this.subs[i].update();
    }
  }
}

```

### 数组响应式



### 缺点

`object`数据里添加一对新的`key/value`或删除一对已有的`key/value`时，它是无法观测到的，导致当我们对`object`数据添加或删除值时，无法通知依赖，无法驱动视图进行响应式更新，`Vue`增加了两个全局API:`Vue.set`和`Vue.delete`来操作数据

### 总结

1. `Data`通过`observer`转换成了`getter/setter`的形式来追踪变化。
2. 当外界通过`Watcher`读取数据时，会触发`getter`从而将`Watcher`添加到依赖中。
3. 当数据发生了变化时，会触发`setter`，从而向`Dep`中的依赖（即Watcher）发送通知。
4. `Watcher`接收到通知后，会向外界发送通知，变化通知到外界后可能会触发视图更新，也有可能触发用户的某个回调函数等。

## 虚拟DOM

所谓虚拟DOM，就是用一个`JS`对象来描述一个`DOM`节点

### 为什么需要虚拟DOM

数据发生变化视图就要随之更新，在更新视图的时候难免要操作`DOM`,而操作真实`DOM`又是非常耗费性能的，用`JS`模拟出一个`DOM`节点，当数据发生变化时，对比变化前后的虚拟`DOM`节点，通过`DOM-Diff`算法计算出需要更新的地方，然后去更新需要更新的视图

### VNode 类

`VNode`类中包含了描述一个真实`DOM`节点所需要的一系列属性，如`tag`表示节点的标签名，`text`表示节点中包含的文本，`children`表示该节点包含的子节点等

```js
export default class VNode {
  constructor (
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    this.tag = tag                                /*当前节点的标签名*/
    this.data = data        /*当前节点对应的对象，包含了具体的一些数据信息，是一个VNodeData类型，可以参考VNodeData类型中的数据信息*/
    this.children = children  /*当前节点的子节点，是一个数组*/
    this.text = text     /*当前节点的文本*/
    this.elm = elm       /*当前虚拟节点对应的真实dom节点*/
    this.ns = undefined            /*当前节点的名字空间*/
    this.context = context          /*当前组件节点对应的Vue实例*/
    this.fnContext = undefined       /*函数式组件对应的Vue实例*/
    this.fnOptions = undefined
    this.fnScopeId = undefined
    this.key = data && data.key           /*节点的key属性，被当作节点的标志，用以优化*/
    this.componentOptions = componentOptions   /*组件的option选项*/
    this.componentInstance = undefined       /*当前节点对应的组件的实例*/
    this.parent = undefined           /*当前节点的父节点*/
    this.raw = false         /*简而言之就是是否为原生HTML或只是普通文本，innerHTML的时候为true，textContent的时候为false*/
    this.isStatic = false         /*静态节点标志*/
    this.isRootInsert = true      /*是否作为跟节点插入*/
    this.isComment = false             /*是否为注释节点*/
    this.isCloned = false           /*是否为克隆节点*/
    this.isOnce = false                /*是否有v-once指令*/
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  get child (): Component | void {
    return this.componentInstance
  }
}
```

### VNode类型

- 注释节点

  `text`表示具体的注释信息；`isComment`表示是否是注释节点的标志

  ```js
  // 创建注释节点
  export const createEmptyVNode = (text: string = '') => {
    const node = new VNode()
    node.text = text
    node.isComment = true
    return node
  }
  ```

  

- 文本节点

  对应VNode构造函数的`context`属性

  ```js
  // 创建文本节点
  export function createTextVNode (val: string | number) {
    return new VNode(undefined, undefined, undefined, String(val))
  }
  ```

  

- 元素节点

  描述节点标签名词的`tag`属性，描述节点属性如`class`、`attributes`等的`data`属性,有描述包含的子节点信息的`children`属性

  ```js
  // 真实DOM节点
  <div id='box'><a>超链接</a></div>
  
  // VNode节点
  {
    tag:'div',
    data:{
        attrs:{
            id:'box'
        }
    },
    children:[
      {
        tag:'span',
        text:'超链接'
      }
    ]
  }
  ```

  

- 组件节点

  组件节点除了有元素节点具有的属性之外，它还有两个特有的属性：

  - componentOptions :组件的option选项，如组件的`props`等
  - componentInstance :当前组件节点对应的`Vue`实例

- 函数式组件节点

  函数式组件节点相较于组件节点，它又有两个特有的属性：

  - fnContext:函数式组件对应的Vue实例
  - fnOptions: 组件的option选项

- 克隆节点

  克隆节点就是把一个已经存在的节点复制一份出来，它主要是为了做模板编译优化时使用

```js
// 创建克隆节点
export function cloneVNode (vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children,
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  )
  cloned.ns = vnode.ns
  cloned.isStatic = vnode.isStatic
  cloned.key = vnode.key
  cloned.isComment = vnode.isComment
  cloned.fnContext = vnode.fnContext
  cloned.fnOptions = vnode.fnOptions
  cloned.fnScopeId = vnode.fnScopeId
  cloned.asyncMeta = vnode.asyncMeta
  cloned.isCloned = true
  return cloned
}
```

## DOM-Diff

**Diff算法是一种对比算法**，采用深度优先算法，新旧虚拟DOM对比的时候，Diff算法比较只会在同层级进行, 不会跨层级比较，对比两者是`旧虚拟DOM和新虚拟DOM`，对比出是哪个`虚拟节点`更改了，找出这个`虚拟节点`，并只更新这个虚拟节点所对应的`真实节点`，而不用更新其他数据没发生改变的节点，实现`精准`地更新真实DOM，进而`提高效率`

### patch

创建节点：新的`VNode`中有而旧的`oldVNode`中没有，就在旧的`oldVNode`中创建

vnode中有六种节点，只有元素、文本、注释节点可以被创建并插入到DOM中，Vue在创建节点的时候会判断在新的vnode中有而旧的oldVnde没有这个节点是属于哪个类型的节点，再调用不用的方法创建并插入到DOM中

```js
function createElm (vnode, parentElm, refElm) {
    const data = vnode.data
    const children = vnode.children
    const tag = vnode.tag
    // 判断是否为元素节点
    if (isDef(tag)) {
      	vnode.elm = nodeOps.createElement(tag, vnode)   // 创建元素节点
        createChildren(vnode, children, insertedVnodeQueue) // 创建元素节点的子节点
        insert(parentElm, vnode.elm, refElm)       // 插入到DOM中
     // 是否为注释节点
    } else if (isTrue(vnode.isComment)) {
      vnode.elm = nodeOps.createComment(vnode.text)  // 创建注释节点
      insert(parentElm, vnode.elm, refElm)           // 插入到DOM中
      // 不是元素和注释节点就认为为文本节点
    } else {
      vnode.elm = nodeOps.createTextNode(vnode.text)  // 创建文本节点
      insert(parentElm, vnode.elm, refElm)           // 插入到DOM中
    }
  }
```



删除节点：新的`VNode`中没有而旧的`oldVNode`中有，就从旧的`oldVNode`中删除

```js
function removeNode (el) {
    const parent = nodeOps.parentNode(el)  // 获取父节点
    if (isDef(parent)) {
      nodeOps.removeChild(parent, el)  // 调用父节点的removeChild方法
    }
  }
```



更新节点：新的`VNode`和旧的`oldVNode`中都有，就以新的`VNode`为准，更新旧的`oldVNode`

![img](https://vue-js.com/learn-vue/assets/img/3.7b0442aa.png)

1.判断`VNode`和`oldVNode`是否为静态节点(只有文本没有任何变量的节点)，直接跳过

2.Vnode是文本节点

`VNode`为文本节点是对比`oldvNode`是否为文本节点，是文本节点则判断是否相同，不同则替换，如果`oldNode`不是文本节点，直接使用`setTextNode`改为与`VNode`相同的文本节点

3.元素节点

**包含子节点**

对比`oldVNode`是否包含子节点，如包含需递归对比更新子节点，如不包含，`oldVNode`可能是空节点或文本节点，如`oldVNode`是空节点就把新节点的子节点创建并插入到就得节点里面，如`oldVNode`是文本节点，则清空文本，然后把新节点里的子节点创建一份后插入旧的节点

**不包含子节点**

`oldVNode`如不包含子节点又不是文本节点则证明该节点是个空节点，直接清空即可

```js
// 更新节点
function patchVnode (oldVnode, vnode, insertedVnodeQueue, removeOnly) {
  // vnode与oldVnode是否完全一样？若是，退出程序
  if (oldVnode === vnode) {
    return
  }
  const elm = vnode.elm = oldVnode.elm

  // vnode与oldVnode是否都是静态节点？若是，退出程序
  if (isTrue(vnode.isStatic) &&
    isTrue(oldVnode.isStatic) &&
    vnode.key === oldVnode.key &&
    (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
  ) {
    return
  }

  const oldCh = oldVnode.children
  const ch = vnode.children
  // vnode有text属性？若没有：
  if (isUndef(vnode.text)) {
    // vnode的子节点与oldVnode的子节点是否都存在？
    if (isDef(oldCh) && isDef(ch)) {
      // 若都存在，判断子节点是否相同，不同则更新子节点
      if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly)
    }
    // 若只有vnode的子节点存在
    else if (isDef(ch)) {
      /**
       * 判断oldVnode是否有文本？
       * 若没有，则把vnode的子节点添加到真实DOM中
       * 若有，则清空Dom中的文本，再把vnode的子节点添加到真实DOM中
       */
      if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, '')
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)
    }
    // 若只有oldnode的子节点存在
    else if (isDef(oldCh)) {
      // 清空DOM中的子节点
      removeVnodes(elm, oldCh, 0, oldCh.length - 1)
    }
    // 若vnode和oldnode都没有子节点，但是oldnode中有文本
    else if (isDef(oldVnode.text)) {
      // 清空oldnode文本
      nodeOps.setTextContent(elm, '')
    }
    // 上面两个判断一句话概括就是，如果vnode中既没有text，也没有子节点，那么对应的oldnode中有什么就清空什么
  }
  // 若有，vnode的text属性与oldVnode的text属性是否相同？
  else if (oldVnode.text !== vnode.text) {
    // 若不相同：则用vnode的text替换真实DOM的文本
    nodeOps.setTextContent(elm, vnode.text)
  }
}
```



### 更新子节点

新的子节点为newChildren老的子节点为oldChildren，外层循环newChildren内层循环oldChildren进行一一对比

```js
for (let i = 0; i < newChildren.length; i++) {
  const newChild = newChildren[i];
  for (let j = 0; j < oldChildren.length; j++) {
    const oldChild = oldChildren[j];
    if (newChild === oldChild) {
      // ...
    }
  }
}
```

对比过程的四个情况

- 创建子节点

  如果`newChildren`里面的某个子节点在`oldChildren`里找不到与之相同的子节点，那么说明`newChildren`里面的这个子节点是之前没有的，是需要此次新增的节点，那么就创建子节点

- 删除子节点

  如果把`newChildren`里面的每一个子节点都循环完毕后，发现在`oldChildren`还有未处理的子节点，那就说明这些未处理的子节点是需要被废弃的，那么就将这些节点删除

- 移动子节点

  如果`newChildren`里面的某个子节点在`oldChildren`里找到了与之相同的子节点，但是所处的位置不同，这说明此次变化需要调整该子节点的位置，那就以`newChildren`里子节点的位置为基准，调整`oldChildren`里该节点的位置，使之与在`newChildren`里的位置相同

- 更新子节点

  如果`newChildren`里面的某个子节点在`oldChildren`里找到了与之相同的子节点，并且所处的位置也相同，那么就更新`oldChildren`里该节点，使之与`newChildren`里的该节点相同

```js
if (isUndef(idxInOld)) {    // 如果在oldChildren里找不到当前循环的newChildren里的子节点
    // 新增节点并插入到合适位置
    createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx)
} else {
    // 如果在oldChildren里找到了当前循环的newChildren里的子节点
    vnodeToMove = oldCh[idxInOld]
    // 如果两个节点相同
    if (sameVnode(vnodeToMove, newStartVnode)) {
        // 调用patchVnode更新节点
        patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue)
        oldCh[idxInOld] = undefined
        // canmove表示是否需要移动节点，如果为true表示需要移动，则移动节点，如果为false则不用移动
        canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm)
    }
}
```

### 优化更新子节点

双重循环的方式如果存在4层，如果只是最后一层的元素需要修改则要循环16次，耗费资源。

![img](https://vue-js.com/learn-vue/assets/img/7.057d7609.jpg)

**优化**

(数组里的所有未处理子节点的第一个子节点称为：新前)

1.`newChildren`新前和`oldChildren`旧前，如果相同，那就直接进入更新节点的操作

2.如果不同，把`newChildren`新后和`oldChildren`新后做比对，如果相同，那就直接进入更新节点的操作

3.如果不同，再把`newChildren`新后和`oldChildren`旧前，如果相同，更新节点，更新完后再将`oldChildren`数组里的该节点移动到与`newChildren`数组里节点相同的位置

4.如果不同，再把`newChildren`新前和`oldChildren`新后做比对，如果相同，更新节点，更新完后再将`oldChildren`数组里的该节点移动到与`newChildren`数组里节点相同的位置；



![img](https://vue-js.com/learn-vue/assets/img/8.e4c85c40.png)



