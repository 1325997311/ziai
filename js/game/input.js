/**
 * 输入处理 — 键盘 + 触摸桥接
 */
const GameInput = (() => {
  const keys = {};
  let jumpPressed = false;
  let jumpJustPressed = false;
  let slideHeld = false;
  let dashPressed = false;
  let dashJustPressed = false;

  // 外部触摸状态（由 Vue 设置）
  let extJump = false;
  let extJumpHeld = false;
  let extSlide = false;
  let extDash = false;

  function onKD(e) {
    keys[e.code] = true;
    if (['Space','ArrowUp','KeyW'].includes(e.code)) {
      e.preventDefault(); if (!jumpPressed) jumpJustPressed = true; jumpPressed = true;
    }
    if (['ArrowDown','KeyS'].includes(e.code)) { e.preventDefault(); slideHeld = true; }
    if (['ShiftLeft','ShiftRight','ControlLeft'].includes(e.code)) {
      e.preventDefault(); if (!dashPressed) dashJustPressed = true; dashPressed = true;
    }
    if (['Escape','KeyP'].includes(e.code)) { e.preventDefault(); keys.pause = true; }
  }

  function onKU(e) {
    keys[e.code] = false;
    if (['Space','ArrowUp','KeyW'].includes(e.code)) jumpPressed = false;
    if (['ArrowDown','KeyS'].includes(e.code)) slideHeld = false;
    if (['ShiftLeft','ShiftRight','ControlLeft'].includes(e.code)) dashPressed = false;
    if (['Escape','KeyP'].includes(e.code)) keys.pause = false;
  }

  function consumeJump() {
    if (jumpJustPressed || extJump) {
      jumpJustPressed = false; extJump = false; return true;
    }
    return false;
  }

  function isJumpHeld()  { return jumpPressed || extJumpHeld; }
  function isSlideHeld() { return slideHeld || extSlide; }
  function consumeDash() {
    if (dashJustPressed || extDash) {
      dashJustPressed = false; extDash = false; return true;
    }
    return false;
  }

  function consumePause() {
    if (keys.pause) { keys.pause = false; return true; }
    return false;
  }

  // 外部设置触摸状态
  function setTouchJump(v)   { if (v) extJump = true; extJumpHeld = v; }
  function setTouchSlide(v) { extSlide = v; }
  function setTouchDash()   { extDash = true; }

  function attach() {
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);
  }

  function detach() {
    window.removeEventListener('keydown', onKD);
    window.removeEventListener('keyup', onKU);
  }

  function reset() {
    Object.keys(keys).forEach(k => delete keys[k]);
    jumpPressed = false; jumpJustPressed = false;
    slideHeld = false; dashPressed = false; dashJustPressed = false;
    extJump = false; extJumpHeld = false; extSlide = false; extDash = false;
  }

  return { attach, detach, reset, consumeJump, isJumpHeld, isSlideHeld, consumeDash, consumePause, setTouchJump, setTouchSlide, setTouchDash };
})();
