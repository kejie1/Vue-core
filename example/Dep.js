/*
 * @Author: ChuandongHuang chuandong_huang@human-horizons.com
 * @Date: 2024-01-17 16:05:28
 * @LastEditors: ChuandongHuang chuandong_huang@human-horizons.com
 * @LastEditTime: 2024-01-17 16:48:40
 * @Description:依赖管理器
 */
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
    const sub = this.subs.slice();
    for (let i = 0; i < subs[i].length; i++) {
      this.subs[i].update();
    }
  }
}
