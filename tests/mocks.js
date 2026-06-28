/**
 * 浏览器 API Mock — 让测试能在 Node.js 中运行
 */
global.localStorage = (() => {
  const store = {};
  return {
    getItem(k)  { return store[k] || null; },
    setItem(k,v){ store[k] = String(v); },
    removeItem(k) { delete store[k]; },
    get length() { return Object.keys(store).length; },
    key(i)      { return Object.keys(store)[i] || null; },
    clear()     { Object.keys(store).forEach(k => delete store[k]); },
  };
})();

global.sessionStorage = (() => {
  const store = {};
  return {
    getItem(k)  { return store[k] || null; },
    setItem(k,v){ store[k] = String(v); },
    removeItem(k) { delete store[k]; },
    clear()     { Object.keys(store).forEach(k => delete store[k]); },
  };
})();

global.crypto = {
  randomUUID() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });},
};

global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock Canvas
class MockCanvas {
  constructor() { this.width = 400; this.height = 700; }
  getContext() { return new MockContext(); }
}
class MockContext {
  clearRect(){}
  fillRect(){}
  strokeRect(){}
  fillText(){}
  strokeText(){}
  beginPath(){}
  moveTo(){}
  lineTo(){}
  arc(){}
  fill(){}
  stroke(){}
  save(){}
  restore(){}
  translate(){}
  scale(){}
  setLineDash(){}
  createLinearGradient(){ return { addColorStop(){} }; }
  get fillStyle() { return this._fs; }
  set fillStyle(v) { this._fs = v; }
  get strokeStyle() { return this._ss; }
  set strokeStyle(v) { this._ss = v; }
  get lineWidth() { return this._lw; }
  set lineWidth(v) { this._lw = v; }
  get globalAlpha() { return this._ga; }
  set globalAlpha(v) { this._ga = v; }
  get textAlign() { return this._ta; }
  set textAlign(v) { this._ta = v; }
  get font() { return this._f; }
  set font(v) { this._f = v; }
}

// Load mocks before modules
global.document = { getElementById() { return new MockCanvas(); } };
global.window = { addEventListener(){}, removeEventListener(){} };
global.Math = Math;

// Load project modules (they need mocks first)
require('../js/config.js');
require('../js/pool.js');
require('../js/eventbus.js');
require('../js/progression.js');
require('../js/notes.js');
require('../js/storage.js');
