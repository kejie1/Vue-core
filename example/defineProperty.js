/*
 * @Author: ChuandongHuang chuandong_huang@human-horizons.com
 * @Date: 2024-01-17 15:45:48
 * @LastEditors: ChuandongHuang chuandong_huang@human-horizons.com
 * @LastEditTime: 2024-01-18 13:35:54
 * @Description:
 */
let person = {
  age: 18,
  name: "tom",
};

class Observer {
  constructor(data) {
    // 新增一个ob属性，表示已经是响应式数据了，避免重复操作
    // def(data, '__ob__', this);
    this.dep = new Dep(); // 实例化一个依赖管理器，用来收集数组依赖
    if (Array.isArray(data)) {
      // 处理数组逻辑
      data.__proto__ = arrayMethods;
      this.observeArray(data);
      console.log("🚀 ~ Observer ~ constructor ~ data:", data);
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
  observeArray(data) {
    for (let i = 0, l = data.length; i < l; i++) {
      new Observer(data[i]);
    }
  }
}
function defineReactive(data, val, key) {
  const dep = new Dep(); // 每个属性都有自己的dep实例
  // 如果数据为object,需要再次调用
  if (typeof val === "object") {
    new Observer(val);
  }
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get() {
      Dep.target && dep.addSub(Dep.target); // 在get的时候依赖收集
      console.log("🚀 ~ get ~ val:", val);
      return val;
    },
    set(newVal) {
      if (val === newVal) return;
      console.log("🚀 ~ set ~ newVal:", newVal);
      val = newVal;
      dep.notify(newVal); // set时通知更新
    },
  });
}
// 依赖管理器
class Dep {
  constructor() {
    this.subs = [];
  }
  // 添加依赖
  addSub(sub) {
    this.subs.push(sub);
  }
  // 通知依赖更新
  notify() {
    const subs = this.subs.slice();
    console.log(subs[0]);
    for (let i = 0; i < subs.length; i++) {
      this.subs[i].cb();
    }
  }
}
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
// new Observer(person);
// const vm = { _data: person };
// const watcher = new Watcher(vm, "age", () => {
//   console.log("🚀 ~ watcher ~ 函数回调:");
// });
// person.age = 20;

const arr = new Observer([1, 2, 3]);
console.log("🚀 ~ arr:", arr);
arr.push(4);
