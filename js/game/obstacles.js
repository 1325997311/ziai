/**
 * 障碍物系统 — 自包含状态
 */
const Obstacles = (() => {
  const { GROUND_Y } = Renderer;
  const SPAWN_X = 500;

  const TYPES = [
    { type:'cactus_small', w:12, h:28, yOff:0,   weight:5 },
    { type:'cactus_large', w:12, h:44, yOff:-14, weight:4 },
    { type:'bird',         w:24, h:12, yOff:-70, weight:3 },
    { type:'bird',         w:24, h:12, yOff:-110,weight:2 },
    { type:'crack',        w:36, h:8,  yOff:0,   weight:1 },
  ];

  const MIN_GAP = 130; // minimum pixels between obstacles

  let items = [];
  let spawnTimer = 0;
  let lastSpawnX = -999;

  function create() {
    items = [];
    spawnTimer = 0;
    lastSpawnX = -999;
  }

  function update(speed, frameMult, score) {
    const fm = frameMult || 1;
    for (const o of items) o.x -= speed * fm;
    items = items.filter(o => o.x > -60);

    spawnTimer -= speed * fm;
    if (spawnTimer <= 0) {
      spawn();
      // Density: sparse early, dense later (based on score)
      const t = Math.min(1, (score || 0) / 50000); // 0→1 over 50000 score
      const minGap = 160 - t * 90;  // 160 → 70
      const maxGap = 280 - t * 150; // 280 → 130
      spawnTimer = minGap + Math.random() * (maxGap - minGap);
    }
  }

  function spawn() {
    const totalW = TYPES.reduce((s,t)=>s+t.weight,0);
    let r = Math.random() * totalW;
    let chosen = TYPES[0];
    for (const t of TYPES) { r -= t.weight; if (r <= 0) { chosen = t; break; } }
    // Ensure minimum gap from last obstacle
    let sx = SPAWN_X + Math.random() * 100;
    if (lastSpawnX > 0 && sx - lastSpawnX < MIN_GAP) {
      sx = lastSpawnX + MIN_GAP + Math.random() * 60;
    }
    // Also check against thief-thrown rocks
    for (const r of (typeof Thief !== 'undefined' && Thief.getThrownRocks ? Thief.getThrownRocks() : [])) {
      if (Math.abs(sx - r.x) < MIN_GAP) {
        sx = r.x + MIN_GAP + Math.random() * 60;
      }
    }
    lastSpawnX = sx;
    items.push({
      type: chosen.type,
      x: sx,
      y: GROUND_Y - chosen.h + chosen.yOff,
      w: chosen.w, h: chosen.h,
    });
  }

  function all() { return items; }

  function clearNear(x, range) {
    items = items.filter(o => Math.abs(o.x - x) > range);
  }

  function breakNear(x, size) {
    items = items.filter(o => {
      if (o.x > x - 10 && o.x < x + size + 10 &&
          (o.type === 'cactus_small' || o.type === 'cactus_large' || o.type === 'rock')) {
        return false;
      }
      return true;
    });
  }

  function updateMoveOnly(speed, frameMult) {
    const fm = frameMult || 1;
    for (const o of items) o.x -= speed * fm;
    items = items.filter(o => o.x > -60);
  }

  return { create, update, updateMoveOnly, all, clearNear, breakNear };
})();
