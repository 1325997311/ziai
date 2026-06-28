/**
 * 轻量对象池 — 减少 GC 抖动
 */
const Pool = (() => {
  function create(factory, reset, initialSize = 20) {
    const free = [];
    for (let i = 0; i < initialSize; i++) free.push(factory());

    return {
      /** 获取一个对象 (池空则新建) */
      acquire() {
        return free.length > 0 ? free.pop() : factory();
      },
      /** 归还对象到池中 */
      release(obj) {
        reset(obj);
        free.push(obj);
      },
      /** 批量归还 */
      releaseAll(arr) {
        for (const obj of arr) { reset(obj); free.push(obj); }
      },
      get size() { return free.length; },
    };
  }

  return { create };
})();
