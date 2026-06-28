/**
 * 金币系统 — 跑酷路上收集金币
 */
const Coins = (() => {
  const { GROUND_Y } = CONFIG;
  const SPAWN_X = 550;

  let items = [];
  let spawnTimer = 0;
  let collected = 0;

  function create() {
    items = [];
    spawnTimer = 0;
    collected = 0;
  }

  function update(speed, frameMult) {
    const fm = frameMult || 1;
    for (let i = items.length - 1; i >= 0; i--) {
      items[i].x -= speed * fm;
      if (items[i].x < -30) items.splice(i, 1);
    }

    spawnTimer -= speed * fm;
    if (spawnTimer <= 0) {
      spawnCoin();
      spawnTimer = 120 + Math.random() * 200;
    }
  }

  function spawnCoin() {
    const isAir = Math.random() < 0.35;
    const y = isAir
      ? GROUND_Y - 60 - Math.random() * 80  // air coin
      : GROUND_Y - 18;                        // ground coin
    items.push({ x: SPAWN_X + Math.random() * 80, y, w: 12, h: 12, collected: false });
  }

  /** Check and collect coins near player */
  function checkCollect(px, pw, py, ph) {
    for (const c of items) {
      if (c.collected) continue;
      if (c.x < px + pw && c.x + c.w > px &&
          c.y < py + ph && c.y + c.h > py) {
        c.collected = true;
        collected++;
        return true;
      }
    }
    return false;
  }

  function all()           { return items; }
  function getCollected()  { return collected; }

  /** Draw a Win98 coin */
  function draw(ctx, coin) {
    if (coin.collected) return;
    const cx = coin.x + 6, cy = coin.y + 6;
    ctx.fillStyle = '#ffff00';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 8px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('$', cx, cy + 3);
    ctx.textAlign = 'start';
  }

  return { create, update, checkCollect, all, getCollected, draw };
})();
