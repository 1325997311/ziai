/**
 * 障碍物系统 — 环境障碍生成 + 间距控制
 */
const Obstacles = (() => {
  const { GROUND_Y, OBSTACLE_MIN_GAP, OBSTACLE_SPAWN_X, OBSTACLE_DENSITY_MAX } = CONFIG;

  const TYPES = [
    { type:'cactus_small', w:12, h:28, yOff:0,   weight:5 },
    { type:'cactus_large', w:12, h:44, yOff:-14, weight:4 },
    { type:'bird',         w:24, h:12, yOff:-70, weight:3 },
    { type:'bird',         w:24, h:12, yOff:-110,weight:2 },
    { type:'crack',        w:36, h:8,  yOff:0,   weight:1 },
  ];

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
      spawnAtSafePosition(score);
      const t = Math.min(1, (score || 0) / OBSTACLE_DENSITY_MAX);
      const minGap = 160 - t * 90;
      const maxGap = 280 - t * 150;
      spawnTimer = minGap + Math.random() * (maxGap - minGap);
    }
  }

  function spawnAtSafePosition(score) {
    const totalW = TYPES.reduce((s,t)=>s+t.weight,0);
    let r = Math.random() * totalW;
    let chosen = TYPES[0];
    for (const t of TYPES) { r -= t.weight; if (r <= 0) { chosen = t; break; } }

    let sx = OBSTACLE_SPAWN_X + Math.random() * 100;
    if (lastSpawnX > 0 && sx - lastSpawnX < OBSTACLE_MIN_GAP) {
      sx = lastSpawnX + OBSTACLE_MIN_GAP + Math.random() * 60;
    }
    // Avoid thief-thrown rocks
    if (typeof Thief !== 'undefined' && Thief.getThrownRocks) {
      for (const rk of Thief.getThrownRocks()) {
        if (Math.abs(sx - rk.x) < OBSTACLE_MIN_GAP) {
          sx = rk.x + OBSTACLE_MIN_GAP + Math.random() * 60;
        }
      }
    }
    lastSpawnX = sx;
    items.push({
      type: chosen.type,
      x: sx, y: GROUND_Y - chosen.h + chosen.yOff,
      w: chosen.w, h: chosen.h,
    });
  }

  function updateMoveOnly(speed, frameMult) {
    const fm = frameMult || 1;
    for (const o of items) o.x -= speed * fm;
    items = items.filter(o => o.x > -60);
  }

  function all()          { return items; }
  function clearNear(x, r){ items = items.filter(o => Math.abs(o.x - x) > r); }
  function breakNear(x, s){ items = items.filter(o => !(o.x > x-10 && o.x < x+s+10 && ['cactus_small','cactus_large'].includes(o.type))); }

  return { create, update, updateMoveOnly, all, clearNear, breakNear };
})();
