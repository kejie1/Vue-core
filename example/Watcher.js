/*
 * @Author: ChuandongHuang chuandong_huang@human-horizons.com
 * @Date: 2024-01-17 16:16:21
 * @LastEditors: ChuandongHuang chuandong_huang@human-horizons.com
 * @LastEditTime: 2024-01-17 16:31:19
 * @Description:
 */
import { Dep } from "./Dep";
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
    const value = this.vm[data][this.exp]; // 触发getter，实现依赖收集
    Dep.target = null; // 重置Dep.targe 避免影响其他依赖收集
    return value;
  }
  //  更新方法，数据变化时调用
  update() {
    this.cb();
  }
}
