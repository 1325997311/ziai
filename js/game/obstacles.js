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
  // Object pool for obstacle reuse
  const obsPool = Pool.create(
    () => ({ type:'', x:0, y:0, w:0, h:0 }),
    (o) => { o.type=''; o.x=-999; o.y=0; },
    30
  );

  function create() {
    // Return all items to pool
    obsPool.releaseAll(items);
    items = [];
    spawnTimer = 0;
    lastSpawnX = -999;
  }

  function update(speed, frameMult, score) {
    const fm = frameMult || 1;
    // Move + recycle off-screen
    for (let i = items.length - 1; i >= 0; i--) {
      items[i].x -= speed * fm;
      if (items[i].x < -60) {
        obsPool.release(items[i]);
        items.splice(i, 1);
      }
    }

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
    if (typeof Thief !== 'undefined' && Thief.getThrownRocks) {
      for (const rk of Thief.getThrownRocks()) {
        if (Math.abs(sx - rk.x) < OBSTACLE_MIN_GAP) {
          sx = rk.x + OBSTACLE_MIN_GAP + Math.random() * 60;
        }
      }
    }
    lastSpawnX = sx;
    // Acquire from pool
    const obj = obsPool.acquire();
    obj.type = chosen.type;
    obj.x = sx; obj.y = GROUND_Y - chosen.h + chosen.yOff;
    obj.w = chosen.w; obj.h = chosen.h;
    items.push(obj);
  }

  function updateMoveOnly(speed, frameMult) {
    const fm = frameMult || 1;
    for (let i = items.length - 1; i >= 0; i--) {
      items[i].x -= speed * fm;
      if (items[i].x < -60) {
        obsPool.release(items[i]);
        items.splice(i, 1);
      }
    }
    // Keep spawnTimer ticking so obstacles appear right after buffer
    spawnTimer -= speed * fm;
  }

  function all()          { return items; }
  function clearNear(x, range) {
    for (let i = items.length - 1; i >= 0; i--) {
      if (Math.abs(items[i].x - x) <= range) {
        obsPool.release(items[i]);
        items.splice(i, 1);
      }
    }
  }
  function breakNear(x, s) {
    for (let i = items.length - 1; i >= 0; i--) {
      const o = items[i];
      if (o.x > x-10 && o.x < x+s+10 && ['cactus_small','cactus_large'].includes(o.type)) {
        obsPool.release(o);
        items.splice(i, 1);
      }
    }
  }

  return { create, update, updateMoveOnly, all, clearNear, breakNear };
})();
