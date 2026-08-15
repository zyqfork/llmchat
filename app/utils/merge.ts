export function merge(target: any, source: any) {
  Object.keys(source).forEach(function (key) {
    // `__proto__` / `constructor` 拥有特殊语义：
    // - 直接赋值 `target[key] = ...` 会触发原型 setter，导致原型污染；
    // - 递归合并 `merge((target[key] || {}), ...)` 会向 Object.prototype 写属性。
    // 这里改为定义自有数据属性，保留数据内容但不触碰原型链。
    if (key === "__proto__" || key === "constructor") {
      Object.defineProperty(target, key, {
        value: source[key],
        writable: true,
        enumerable: true,
        configurable: true,
      });
      return;
    }

    if (
      source.hasOwnProperty(key) && // Check if the property is not inherited
      source[key] &&
      typeof source[key] === "object"
    ) {
      merge((target[key] = target[key] || {}), source[key]);
      return;
    }
    target[key] = source[key];
  });
} 