/**
 * 小偷 AI — 等级制 + 丢石头
 */
const Thief = (() => {
  const SCREEN_X = 330;

  let thief = null;
  let catchScore = 25000;
  let level = 1;

  let rockCooldown = 0;
  let dashCooldown = 0;
  let throwAnim = 0;
  let thrownRocks = [];

  function create() {
    const { GROUND_Y } = Renderer;
    thief = {
      x: 600, y: GROUND_Y - 30, w: 28, h: 30,
      state: 'running', frame: 0,
      timer: 0, panicTimer: 0,
    };
    thrownRocks = [];
    rockCooldown = 60;
    dashCooldown = 0;
    throwAnim = 0;
  }

  function init(opts) {
    level = opts.thiefLevel || 1;
    catchScore = opts.catchScore || 25000;
  }

  function get() { return thief; }
  function getCatchScore() { return catchScore; }
  function getLevel() { return level; }
  function getThrownRocks() { return thrownRocks; }
  function getThrowAnim() { return throwAnim; }

  function getScreenPos(worldOffset) {
    if (!thief) return null;
    return { ...thief, x: thief.x - worldOffset };
  }

  function update(speed, worldOffset, score, frameMult, isBuffer) {
    if (!thief) return;

    const playerWorldX = worldOffset + 90;
    const dist = thief.x - playerWorldX;
    thief.frame += 0.15;

    if (rockCooldown > 0) rockCooldown--;
    if (dashCooldown > 0) dashCooldown--;
    if (throwAnim > 0) throwAnim--;

    const fm = frameMult || 1;
    for (const r of thrownRocks) r.x -= speed * fm;
    thrownRocks = thrownRocks.filter(r => r.x > -60);

    if (score < catchScore) {
      thief.x = worldOffset + SCREEN_X;
      thief.state = 'running';
    } else {
      if (dist > 300 && Math.random() < 0.005) { thief.state = 'taunting'; thief.timer = 60; }
      if (dist < 100 && thief.state !== 'panicking') { thief.state = 'panicking'; thief.panicTimer = 120; }
      if (thief.state === 'taunting') { thief.timer--; if (thief.timer <= 0) thief.state = 'running'; }
      if (thief.state === 'panicking') { thief.panicTimer--; if (thief.panicTimer <= 0) thief.state = 'running'; }

      let ts = speed * 0.94;
      if (thief.state === 'panicking') ts = speed * 1.08;
      if (thief.state === 'taunting') ts = speed * 0.80;
      thief.x += ts * 0.016;

      if (level >= 3 && dashCooldown <= 0 && dist > 200) {
        dashCooldown = 150 + Math.random() * 80;
        if (level >= 5) dashCooldown *= 0.6;
        thief.state = 'panicking';
        thief.panicTimer = 30;
      }
    }

    // ---- 丢石头 (Lv2+, 缓冲期禁止) ----
    if (level >= 2 && rockCooldown <= 0 && throwAnim <= 0 && !isBuffer) {
      const screenX = thief.x - worldOffset;
      if (canPlaceRock(screenX)) {
        throwAnim = 35; // animation frames
        // Spawn rock at thief's feet immediately
        const { GROUND_Y } = Renderer;
        thrownRocks.push({
          x: screenX - 5,
          y: GROUND_Y - 12,
          w: 18, h: 12,
        });
        rockCooldown = 180 + Math.random() * 120;
        if (level >= 4) rockCooldown = Math.floor(rockCooldown * 0.7);
        if (level >= 5) rockCooldown = Math.floor(rockCooldown * 0.6);
      }
    }
  }

  function canPlaceRock(screenX) {
    const MIN_GAP = 120;
    // Check against thrown rocks
    for (const r of thrownRocks) {
      if (Math.abs(r.x - screenX) < MIN_GAP) return false;
    }
    // Check against environmental obstacles
    for (const o of Obstacles.all()) {
      if (Math.abs(o.x - screenX) < MIN_GAP) return false;
    }
    return true;
  }

  function clearRocks() {
    thrownRocks = [];
  }

  function checkRockCollision(playerScreenX, playerW, playerY, playerH) {
    for (const r of thrownRocks) {
      if (r.x < playerScreenX + playerW && r.x + r.w > playerScreenX &&
          r.y < playerY + playerH && r.y + r.h > playerY) {
        return true;
      }
    }
    return false;
  }

  return { create, init, get, getCatchScore, getLevel, getScreenPos, getThrownRocks,
           getThrowAnim, update, checkRockCollision, clearRocks };
})();
