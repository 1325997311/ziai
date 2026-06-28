/**
 * 小偷 AI — 世界坐标系
 * 分数达标前保持在屏幕右侧，达标后追逐开始
 */
const Thief = (() => {
  const CATCH_SCORE = 5000; // 分数达标后才能追上
  const SCREEN_X = 330;     // 小偷屏幕位置（右侧）

  let thief = null;

  function create() {
    const { GROUND_Y } = Renderer;
    thief = {
      x: 600,
      y: GROUND_Y - 30, w: 28, h: 30,
      state: 'running',
      frame: 0, timer: 0, panicTimer: 0,
    };
  }

  function get() { return thief; }

  function getScreenPos(worldOffset) {
    if (!thief) return null;
    return { ...thief, x: thief.x - worldOffset };
  }

  function update(speed, worldOffset, score) {
    if (!thief) return;
    const playerWorldX = worldOffset + 90;
    const dist = thief.x - playerWorldX;

    thief.frame += 0.15;

    if (score < CATCH_SCORE) {
      // 未达标：小偷锁定在屏幕右侧，无法追上
      thief.x = worldOffset + SCREEN_X;
      thief.state = 'running';
    } else {
      // 达标：小偷开始跑，可以追
      if (dist > 300 && Math.random() < 0.005) { thief.state = 'taunting'; thief.timer = 60; }
      if (dist < 100 && thief.state !== 'panicking') { thief.state = 'panicking'; thief.panicTimer = 120; }
      if (thief.state === 'taunting') { thief.timer--; if (thief.timer <= 0) thief.state = 'running'; }
      if (thief.state === 'panicking') { thief.panicTimer--; if (thief.panicTimer <= 0) thief.state = 'running'; }

      let ts = speed * 0.94;
      if (thief.state === 'panicking') ts = speed * 1.08;
      if (thief.state === 'taunting') ts = speed * 0.80;
      thief.x += ts * 0.016;
    }
  }

  return { create, get, getScreenPos, update, CATCH_SCORE, SCREEN_X };
})();
