/**
 * 小偷 AI — 等级制 + 丢石头
 * 所有参数从 CONFIG 读取
 */
const Thief = (() => {
  const {
    GROUND_Y, THIEF_W: W, THIEF_H: H, THIEF_SCREEN_X,
    THIEF_SPEED_NORMAL, THIEF_SPEED_PANIC, THIEF_SPEED_TAUNT,
    ROCK_COOLDOWN_BASE, ROCK_COOLDOWN_RAND,
    ROCK_COOLDOWN_LV4_MULT, ROCK_COOLDOWN_LV5_MULT,
    THROW_ANIM_FRAMES, ROCK_MIN_GAP, THIEF_START_X,
  } = CONFIG;

  let thief = null;
  let catchScore = CONFIG.THIEF_CATCH_SCORES[1];
  let level = 1;

  let rockCooldown = 0;
  let dashCooldown = 0;
  let throwAnim = 0;
  let thrownRocks = [];

  function create() {
    thief = {
      x: THIEF_START_X, y: GROUND_Y - H, w: W, h: H,
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
    catchScore = opts.catchScore || CONFIG.THIEF_CATCH_SCORES[1];
  }

  function get()         { return thief; }
  function getCatchScore(){ return catchScore; }
  function getLevel()     { return level; }
  function getThrownRocks(){ return thrownRocks; }
  function getThrowAnim()  { return throwAnim; }

  function getScreenPos(worldOffset) {
    if (!thief) return null;
    return { ...thief, x: thief.x - worldOffset };
  }

  function update(speed, worldOffset, score, frameMult, isBuffer) {
    if (!thief) return;

    const playerWorldX = worldOffset + CONFIG.PLAYER_X;
    const dist = thief.x - playerWorldX;
    thief.frame += 0.15;

    // Cooldowns
    if (rockCooldown > 0) rockCooldown--;
    if (dashCooldown > 0) dashCooldown--;
    if (throwAnim > 0) throwAnim--;

    // Move thrown rocks
    const fm = frameMult || 1;
    for (const r of thrownRocks) r.x -= speed * fm;
    thrownRocks = thrownRocks.filter(r => r.x > -60);

    // Positioning
    if (score < catchScore) {
      thief.x = worldOffset + THIEF_SCREEN_X;
      thief.state = 'running';
    } else {
      // AI state transitions
      if (dist > 300 && Math.random() < 0.005)  { thief.state = 'taunting'; thief.timer = 60; }
      if (dist < 100 && thief.state !== 'panicking') { thief.state = 'panicking'; thief.panicTimer = 120; }
      if (thief.state === 'taunting')  { thief.timer--; if (thief.timer <= 0) thief.state = 'running'; }
      if (thief.state === 'panicking') { thief.panicTimer--; if (thief.panicTimer <= 0) thief.state = 'running'; }

      let ts = speed * THIEF_SPEED_NORMAL;
      if (thief.state === 'panicking') ts = speed * THIEF_SPEED_PANIC;
      if (thief.state === 'taunting')  ts = speed * THIEF_SPEED_TAUNT;
      thief.x += ts * 0.016;

      // Lv3+ dash
      if (level >= 3 && dashCooldown <= 0 && dist > 200) {
        dashCooldown = 150 + Math.random() * 80;
        if (level >= 5) dashCooldown *= 0.6;
        thief.state = 'panicking';
        thief.panicTimer = 30;
      }
    }

    // Throw rock (Lv2+, not during buffer)
    if (level >= 2 && rockCooldown <= 0 && throwAnim <= 0 && !isBuffer) {
      const screenX = thief.x - worldOffset;
      if (canPlaceRock(screenX)) {
        throwAnim = THROW_ANIM_FRAMES;
        thrownRocks.push({
          x: screenX - 5,
          y: GROUND_Y - 12, w: 18, h: 12,
        });
        rockCooldown = ROCK_COOLDOWN_BASE + Math.random() * ROCK_COOLDOWN_RAND;
        if (level >= 4) rockCooldown = Math.floor(rockCooldown * ROCK_COOLDOWN_LV4_MULT);
        if (level >= 5) rockCooldown = Math.floor(rockCooldown * ROCK_COOLDOWN_LV5_MULT);
      }
    }
  }

  function canPlaceRock(screenX) {
    for (const r of thrownRocks) {
      if (Math.abs(r.x - screenX) < ROCK_MIN_GAP) return false;
    }
    for (const o of Obstacles.all()) {
      if (Math.abs(o.x - screenX) < ROCK_MIN_GAP) return false;
    }
    return true;
  }

  function clearRocks() { thrownRocks = []; }

  function checkRockCollision(px, pw, py, ph) {
    for (const r of thrownRocks) {
      if (r.x < px + pw && r.x + r.w > px && r.y < py + ph && r.y + r.h > py) return true;
    }
    return false;
  }

  return {
    create, init, get, getCatchScore, getLevel, getScreenPos, getThrownRocks,
    getThrowAnim, update, checkRockCollision, clearRocks,
  };
})();
