/**
 * 事件总线 — 解耦游戏核心与 Vue UI
 * 用法: EventBus.on('game:win', fn) / EventBus.emit('game:win', data)
 */
const EventBus = (() => {
  const listeners = {};

  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
    return () => off(event, fn); // 返回取消订阅函数
  }

  function off(event, fn) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(f => f !== fn);
  }

  function emit(event, data) {
    if (!listeners[event]) return;
    listeners[event].forEach(fn => { try { fn(data); } catch(e) { console.warn('[EventBus]', event, e); } });
  }

  function clear() {
    Object.keys(listeners).forEach(k => delete listeners[k]);
  }

  return { on, off, emit, clear };
})();
