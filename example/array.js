// 防止了后续重写污染Array原型
const arrayProto = Array.prototype;
// 创建一个干净的数组
export const arrayMethods = Object.create(arrayProto);
// 需要重写数组的方法
const methodsToPatch = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];
methodsToPatch.forEach((method) => {
  // 缓存数组的原生方法
  const original = arrayProto[method];
  Object.defineProperty(arrayMethods, method, function mutator(...args) {
    // 调用数组原生方法
    const result = original.apply(this, args);
    const ob = this.__ob__;
    switch (method) {
      case "push":
      case "unshift":
        inserted = args; // 如果是push或unshift方法，那么传入参数就是新增的元素
        break;
      case "splice":
        inserted = args.slice(2); // 如果是splice方法，那么传入参数列表中下标为2的就是新增的元素
        break;
    }
    if (inserted) ob.observeArray(inserted);
    // dep.notify();
    console.log("🚀 ~ mutaror ~ result:", result);
    return result;
  });
});
