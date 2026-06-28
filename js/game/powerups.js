/**
 * 道具系统 — 护盾 / 磁铁 / 加速
 */
const PowerUps = (() => {
  const { GROUND_Y } = CONFIG;
  const TYPES = [
    { type: 'shield', label: '🛡', color: '#0080ff', duration: 0, desc: '挡一次伤害' },
    { type: 'magnet', label: '🧲', color: '#ff0000', duration: 300, desc: '自动吸金币 5s' },
    { type: 'boost',  label: '⚡', color: '#ffaa00', duration: 180, desc: '加速 3s' },
  ];

  let items = [];
  let active = { shield: false, magnet: 0, boost: 0 };
  let spawnCounter = 0;

  function create() {
    items = [];
    active = { shield: false, magnet: 0, boost: 0 };
    spawnCounter = 0;
  }

  function update(speed, frameMult) {
    const fm = frameMult || 1;
    for (let i = items.length - 1; i >= 0; i--) {
      items[i].x -= speed * fm;
      if (items[i].x < -30) items.splice(i, 1);
    }
    // Timers
    if (active.magnet > 0) active.magnet--;
    if (active.boost > 0) active.boost--;

    // Spawn rare power-up (every ~15 obstacles)
    spawnCounter--;
    if (spawnCounter <= 0 && items.length < 2) {
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      items.push({
        ...type,
        x: 500 + Math.random() * 100,
        y: GROUND_Y - 55,
        w: 18, h: 18,
      });
      spawnCounter = 600 + Math.random() * 400; // 10-17s
    }
  }

  function checkCollect(px, pw, py, ph) {
    for (const p of items) {
      if (p.x < px + pw && p.x + p.w > px && p.y < py + ph && p.y + p.h > py) {
        activate(p.type);
        const idx = items.indexOf(p);
        if (idx >= 0) items.splice(idx, 1);
        return p;
      }
    }
    return null;
  }

  function activate(type) {
    if (type === 'shield') active.shield = true;
    if (type === 'magnet') active.magnet = TYPES[1].duration;
    if (type === 'boost')  active.boost  = TYPES[2].duration;
  }

  function isShieldActive()  { return active.shield; }
  function consumeShield()   { active.shield = false; }
  function isMagnetActive()  { return active.magnet > 0; }
  function isBoostActive()   { return active.boost > 0; }
  function all()             { return items; }
  function getActive()       { return active; }

  function draw(ctx, p) {
    // Colored square with letter
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(p.label, p.x + 9, p.y + 14);
    ctx.textAlign = 'start';
  }

  return { create, update, checkCollect, all, getActive, isShieldActive, consumeShield, isMagnetActive, isBoostActive, draw };
})();
