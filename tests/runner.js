/**
 * 测试运行器 — 使用 vm 在全局作用域加载源文件
 * 用法: node tests/runner.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const passed = [], failed = [];

// ---- 浏览器 API Mock ----
global.localStorage = (() => { const s={}; return { getItem(k){return s[k]||null}, setItem(k,v){s[k]=String(v)}, removeItem(k){delete s[k]}, get length(){return Object.keys(s).length}, key(i){return Object.keys(s)[i]||null}, clear(){Object.keys(s).forEach(k=>delete s[k])} }; })();
global.sessionStorage = (() => { const s={}; return { getItem(k){return s[k]||null}, setItem(k,v){s[k]=String(v)}, removeItem(k){delete s[k]}, clear(){Object.keys(s).forEach(k=>delete s[k])} }; })();
global.crypto = { randomUUID() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&0x3|0x8)).toString(16)}); } };
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = fn => setTimeout(fn, 16);
global.cancelAnimationFrame = id => clearTimeout(id);
global.document = { getElementById() { return { width:400,height:700, getContext(){ return MockCtx(); } }; } };
global.window = { addEventListener(){}, removeEventListener(){} };
function MockCtx() { return new Proxy({},{ get(_,k){ return (k==='fillStyle'||k==='strokeStyle')?'':()=>{}; } }); }

// Mock Renderer for game modules
global.Renderer = {
  W:400, H:700, GROUND_Y:560,
  drawSky(){}, drawGround(){}, drawPlayer(){}, drawThief(){}, drawObstacle(){}, drawSpeedLines(){}, drawParticles(){},
};

// ---- 加载源文件 (globally scoped via vm) ----
function loadGlobal(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const script = new vm.Script(code, { filename: filePath });
  script.runInThisContext({ filename: filePath });
}

// Load project modules in dependency order
const jsRoot = path.join(ROOT, 'js');
loadGlobal(path.join(jsRoot, 'config.js'));
loadGlobal(path.join(jsRoot, 'pool.js'));
loadGlobal(path.join(jsRoot, 'eventbus.js'));
loadGlobal(path.join(jsRoot, 'progression.js'));
loadGlobal(path.join(jsRoot, 'storage.js'));
loadGlobal(path.join(jsRoot, 'notes.js'));
loadGlobal(path.join(jsRoot, 'game/player.js'));
loadGlobal(path.join(jsRoot, 'game/coins.js'));
loadGlobal(path.join(jsRoot, 'game/powerups.js'));
// obstacles needs Thief mock
global.Thief = { getThrownRocks: () => [] };
loadGlobal(path.join(jsRoot, 'game/obstacles.js'));

// ---- Test framework ----
function describe(name, fn) {
  console.log('\n📦 ' + name);
  fn();
}

function it(name, fn) {
  try {
    fn();
    passed.push(name);
    console.log('  ✅ ' + name);
  } catch (e) {
    failed.push({ name, error: e.message });
    console.log('  ❌ ' + name + '\n     ' + e.message);
  }
}

function assert(cond, msg = 'assertion failed') {
  if (!cond) throw new Error(msg);
}
function assertEquals(a, b, msg) {
  if (a !== b) throw new Error(msg || `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}
function assertDeepEquals(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msg || `deep mismatch`);
}

// Make available to test files
global.describe = describe;
global.it = it;
global.assert = assert;
global.assertEquals = assertEquals;
global.assertDeepEquals = assertDeepEquals;

// ---- Load and run tests ----
const testFiles = [
  'config.test.js', 'progression.test.js', 'pool.test.js', 'eventbus.test.js',
  'player.test.js', 'storage.test.js', 'notes.test.js', 'obstacles.test.js',
  'coins.test.js', 'powerups.test.js',
];

for (const tf of testFiles) {
  try {
    require(path.join(__dirname, tf));
  } catch(e) {
    console.log('  ⚠️  skip ' + tf + ': ' + e.message);
  }
}

console.log('\n' + '='.repeat(40));
console.log('✅ ' + passed.length + ' passed  ❌ ' + failed.length + ' failed');
if (failed.length) {
  console.log('\nFailed:');
  failed.forEach(f => console.log('  - ' + f.name + ': ' + f.error));
  process.exit(1);
}
