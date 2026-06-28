/**
 * 渲染器 — Win98 像素风
 */
const Renderer = (() => {
  const W = 400, H = 700;
  const GROUND_Y = 560;
  // Win98 palette
  const C = {
    desktop: '#008080',
    bg: '#c0c0c0',
    white: '#fff',
    black: '#000',
    navy: '#000080',
    gray: '#808080',
    dgray: '#404040',
    highlight: '#dfdfdf',
    yellow: '#ffff00',
    red: '#ff0000',
    blue: '#0000ff',
  };

  function drawSky(ctx, scrollX) {
    // Teal desktop sky
    ctx.fillStyle = C.desktop;
    ctx.fillRect(0, 0, W, GROUND_Y);

    // Win98 clouds (white squares with shadow)
    ctx.fillStyle = C.white;
    ctx.shadowColor = C.dgray; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
    drawWinCloud(ctx, 80, 90, 1.2, scrollX * 0.1);
    drawWinCloud(ctx, 280, 60, 0.8, scrollX * 0.08);
    drawWinCloud(ctx, 360, 110, 1, scrollX * 0.12);
    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowColor = 'transparent';
  }

  function drawWinCloud(ctx, bx, by, s, off) {
    const x = ((bx - off) % (W + 200)) - 100;
    ctx.fillStyle = C.white;
    ctx.fillRect(x, by, 40 * s, 20 * s);
    ctx.fillRect(x + 15 * s, by - 8 * s, 25 * s, 16 * s);
    ctx.strokeStyle = C.dgray; ctx.lineWidth = 1;
    ctx.strokeRect(x, by, 40 * s, 20 * s);
  }

  function drawGround(ctx, scrollX) {
    // Gray taskbar-like ground
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    // Top border (raised)
    ctx.fillStyle = C.white;
    ctx.fillRect(0, GROUND_Y, W, 3);
    ctx.fillStyle = C.gray;
    ctx.fillRect(0, GROUND_Y + 3, W, 1);
    // Grid pattern
    const TW = 32;
    const start = Math.floor(scrollX / TW);
    ctx.fillStyle = C.dgray;
    for (let i = 0; i < Math.ceil(W/TW)+2; i++) {
      const tx = (start+i)*TW - scrollX;
      if (tx < -TW || tx > W) continue;
      if ((start+i) % 4 === 0) {
        ctx.fillRect(tx + 4, GROUND_Y + 12, TW - 8, 1);
        ctx.fillRect(tx + 14, GROUND_Y + 30, TW - 28, 1);
      }
    }
  }

  // ====== RABBIT (Win98 cursor style) ======
  function drawPlayer(ctx, p) {
    if (p.invincible && Math.floor(Date.now()/100)%2===0) return;
    const {x,y,w,h,state,frame} = p;
    ctx.save(); ctx.translate(x, y);

    if (state==='dash' && p.trail) {
      p.trail.forEach((t,i) => {
        ctx.globalAlpha = 0.12 * (i+1) / p.trail.length;
        drawRabbit(ctx, t.x-x, t.y-y, state, frame, 0);
      });
      ctx.globalAlpha = 1;
    }

    const bob = (state==='running') ? Math.sin(frame*0.8)*2 : 0;
    drawRabbit(ctx, 0, 0, state, frame, bob);
    ctx.restore();
  }

  function drawRabbit(ctx, ox, oy, state, frame, bob) {
    const b = '#000', w = '#fff', pink = '#ffb6c1', gray = '#808080';
    ctx.lineWidth = 1.5;

    if (state === 'sliding') {
      // ---- SLIDING RABBIT ----
      // Ears flat back
      ctx.fillStyle = w; ctx.strokeStyle = b;
      ctx.fillRect(ox + 2, oy + 6, 16, 4); ctx.strokeRect(ox + 2, oy + 6, 16, 4);
      ctx.fillStyle = pink;
      ctx.fillRect(ox + 4, oy + 7, 5, 2);

      // Body stretched low
      ctx.fillStyle = w; ctx.strokeStyle = b;
      ctx.fillRect(ox + 2, oy + 10, 24, 12); ctx.strokeRect(ox + 2, oy + 10, 24, 12);
      // Eye
      ctx.fillStyle = b;
      ctx.fillRect(ox + 6, oy + 13, 3, 3);
      ctx.fillStyle = w;
      ctx.fillRect(ox + 7, oy + 14, 1, 1);
      // Tail
      ctx.fillStyle = w; ctx.strokeStyle = b;
      ctx.beginPath(); ctx.arc(ox + 26, oy + 15, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      return;
    }

    // ====== NORMAL / JUMPING / DASHING ======
    const earWiggle = state === 'running' ? Math.sin(frame * 1.2) * 2.5 : 0;
    const lean = state === 'dashing' ? 3 : 0;

    // ---- EARS ----
    // Left ear
    ctx.fillStyle = w; ctx.strokeStyle = b;
    ctx.fillRect(ox + 6, oy + bob - 15 + earWiggle, 6, 18);
    ctx.strokeRect(ox + 6, oy + bob - 15 + earWiggle, 6, 18);
    ctx.fillStyle = pink;
    ctx.fillRect(ox + 8, oy + bob - 11 + earWiggle, 3, 10);

    // Right ear
    ctx.fillStyle = w; ctx.strokeStyle = b;
    ctx.fillRect(ox + 16, oy + bob - 15 - earWiggle, 6, 18);
    ctx.strokeRect(ox + 16, oy + bob - 15 - earWiggle, 6, 18);
    ctx.fillStyle = pink;
    ctx.fillRect(ox + 17, oy + bob - 11 - earWiggle, 3, 10);

    // ---- HEAD ----
    ctx.fillStyle = w; ctx.strokeStyle = b;
    ctx.fillRect(ox + 4, oy + bob, 20, 15);
    ctx.strokeRect(ox + 4, oy + bob, 20, 15);

    // Eyes
    ctx.fillStyle = b;
    ctx.fillRect(ox + 8, oy + bob + 3, 4, 5);
    ctx.fillRect(ox + 16, oy + bob + 3, 4, 5);
    ctx.fillStyle = w;
    ctx.fillRect(ox + 9, oy + bob + 4, 2, 2);
    ctx.fillRect(ox + 17, oy + bob + 4, 2, 2);

    // Nose
    ctx.fillStyle = pink;
    ctx.fillRect(ox + 5, oy + bob + 8, 3, 2);
    // Whiskers
    ctx.fillStyle = gray;
    ctx.fillRect(ox + 1, oy + bob + 8, 3, 0.5);
    ctx.fillRect(ox + 1, oy + bob + 10, 3, 0.5);

    // ---- BODY ----
    ctx.fillStyle = w; ctx.strokeStyle = b;
    ctx.fillRect(ox + 2 + lean, oy + bob + 15, 24, 16);
    ctx.strokeRect(ox + 2 + lean, oy + bob + 15, 24, 16);

    // Belly patch
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(ox + 8 + lean, oy + bob + 17, 12, 10);

    // ---- LEGS ----
    const lp = Math.sin(frame * 0.7) * (state === 'running' ? 4 : 1);
    // Back leg
    ctx.fillStyle = w; ctx.strokeStyle = b;
    ctx.fillRect(ox + 3, oy + bob + 31 + lp, 10, 7);
    ctx.strokeRect(ox + 3, oy + bob + 31 + lp, 10, 7);
    // Foot
    ctx.fillStyle = gray;
    ctx.fillRect(ox + 3, oy + bob + 36 + lp, 10, 3);

    // Front leg
    ctx.fillStyle = w; ctx.strokeStyle = b;
    ctx.fillRect(ox + 15, oy + bob + 31 - lp, 10, 7);
    ctx.strokeRect(ox + 15, oy + bob + 31 - lp, 10, 7);
    ctx.fillStyle = gray;
    ctx.fillRect(ox + 15, oy + bob + 36 - lp, 10, 3);

    // ---- TAIL ----
    ctx.fillStyle = w; ctx.strokeStyle = b;
    ctx.beginPath();
    ctx.arc(ox + 28 + lean, oy + bob + 20, 6, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Tail fluff detail
    ctx.fillStyle = pink;
    ctx.beginPath();
    ctx.arc(ox + 29 + lean, oy + bob + 19, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // ---- DASH EFFECT ----
    if (state === 'dashing') {
      ctx.fillStyle = b;
      ctx.fillRect(ox - 8, oy + bob + 18, 6, 8);
      ctx.fillRect(ox - 14, oy + bob + 20, 5, 4);
      ctx.fillStyle = gray;
      ctx.fillRect(ox - 6, oy + bob + 19, 3, 2);
    }
  }

  // ====== THIEF (黑色蒙面忍者) ======
  function drawThief(ctx, t) {
    const {x,y,state,frame} = t;
    ctx.save(); ctx.translate(x, y);
    const bob = Math.sin(frame*0.8)*2;
    const b = '#000', w = '#fff', skin = '#fdcb6e', red = '#e74c3c';
    ctx.lineWidth = 1.5;

    // Legs (dark pants)
    const lp = Math.sin(frame*0.7)*4;
    ctx.fillStyle = b;
    ctx.fillRect(9, bob + 26 + lp, 7, 7);
    ctx.fillRect(17, bob + 26 - lp, 7, 7);
    // Shoes
    ctx.fillStyle = '#333';
    ctx.fillRect(8, bob + 31 + lp, 9, 4);
    ctx.fillRect(16, bob + 31 - lp, 9, 4);

    // Body (black ninja suit)
    ctx.fillStyle = b;
    ctx.fillRect(7, bob + 12, 16, 16);
    // Belt
    ctx.fillStyle = red;
    ctx.fillRect(7, bob + 22, 16, 3);
    // Belt buckle
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(13, bob + 22, 4, 3);

    // Arm (holding scroll)
    ctx.fillStyle = b;
    ctx.fillRect(1, bob + 13, 6, 4);

    // Stolen scroll on back
    ctx.fillStyle = w; ctx.strokeStyle = b; ctx.lineWidth = 1;
    ctx.fillRect(2, bob + 9, 5, 9); ctx.strokeRect(2, bob + 9, 5, 9);
    ctx.fillStyle = red;
    ctx.fillRect(3, bob + 11, 3, 1);
    ctx.fillRect(3, bob + 14, 3, 1);

    // Head
    ctx.fillStyle = skin;
    ctx.fillRect(10, bob + 1, 12, 12);
    ctx.strokeStyle = b; ctx.lineWidth = 1.5;
    ctx.strokeRect(10, bob + 1, 12, 12);

    // Ninja mask (covers lower face)
    ctx.fillStyle = b;
    ctx.fillRect(8, bob + 5, 16, 7);

    // Eyes (peeking through mask)
    ctx.fillStyle = w;
    ctx.fillRect(12, bob + 5, 3, 3);
    ctx.fillRect(17, bob + 5, 3, 3);
    ctx.fillStyle = b;
    ctx.fillRect(13, bob + 6, 1.5, 1.5);
    ctx.fillRect(18, bob + 6, 1.5, 1.5);

    // Headband
    ctx.fillStyle = red;
    ctx.fillRect(9, bob + 0, 14, 3);
    // Headband tails
    ctx.fillStyle = red;
    ctx.fillRect(1, bob - 2, 3, 6);

    // Taunting: tongue out
    if (state === 'taunting') {
      ctx.fillStyle = '#ff7675';
      ctx.fillRect(14, bob + 12, 6, 3);
    }
    // Panicking: sweat drops
    if (state === 'panicking') {
      ctx.fillStyle = '#74b9ff';
      ctx.fillRect(22, bob - 2, 3, 5);
      ctx.fillRect(26, bob + 1, 2, 4);
    }
    ctx.restore();
  }

  // ====== OBSTACLES (Win98 icons) ======
  function drawObstacle(ctx, obs) {
    const {x,y,w,h,type} = obs;
    ctx.lineWidth = 1.5;
    switch(type) {
      case 'cactus_small':
        // Win98 error icon style
        ctx.fillStyle = C.white; ctx.strokeStyle = C.black;
        ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x+2, y-8, 3, 8); ctx.strokeRect(x+2, y-8, 3, 8);
        ctx.fillStyle = C.red;
        ctx.fillRect(x+3, y+3, w-6, 3);
        ctx.fillRect(x+4, y+11, w-8, 3);
        break;
      case 'cactus_large':
        ctx.fillStyle = C.white; ctx.strokeStyle = C.black;
        ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x+2, y-15, 4, 15); ctx.strokeRect(x+2, y-15, 4, 15);
        ctx.fillStyle = C.red;
        ctx.fillRect(x+3, y+4, w-6, 4);
        ctx.fillRect(x+3, y+16, w-6, 4);
        break;
      case 'rock':
        // Gray 3D box (Win98 button style)
        ctx.fillStyle = C.bg; ctx.strokeStyle = C.black;
        ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = C.white;
        ctx.fillRect(x+1, y+1, w-2, 2);
        ctx.fillRect(x+1, y+1, 2, h-2);
        ctx.fillStyle = C.dgray;
        ctx.fillRect(x+1, y+h-3, w-2, 2);
        ctx.fillRect(x+w-3, y+1, 2, h-2);
        break;
      case 'bird':
        // Win98 folder icon bird
        const wu = Math.sin(Date.now()/100)>0;
        ctx.fillStyle = C.yellow; ctx.strokeStyle = C.black;
        ctx.fillRect(x+2, y+(wu?2:6), w-4, 6);
        ctx.strokeRect(x+2, y+(wu?2:6), w-4, 6);
        ctx.fillStyle = C.navy;
        ctx.fillRect(x, y+4, w, 3);
        ctx.fillStyle = C.white;
        ctx.fillRect(x+w-7, y+5, 2, 1);
        break;
      case 'bat':
        ctx.fillStyle = C.dgray; ctx.strokeStyle = C.black;
        ctx.fillRect(x+3, y+2, w-6, 8);
        ctx.strokeRect(x+3, y+2, w-6, 8);
        ctx.fillStyle = C.red;
        ctx.fillRect(x+w/2-1, y+4, 2, 2);
        break;
      case 'wall':
        ctx.fillStyle = C.bg; ctx.strokeStyle = C.black;
        ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
        for(let by=y; by<y+h; by+=10) {
          ctx.strokeStyle = C.dgray;
          ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x+w, by); ctx.stroke();
        }
        break;
      case 'crack':
        ctx.fillStyle = C.black;
        ctx.fillRect(x, GROUND_Y, w, 8);
        ctx.fillStyle = C.desktop;
        ctx.fillRect(x+2, GROUND_Y, w-4, 8);
        break;
    }
  }

  function drawSpeedLines(ctx, speed) {
    if(speed<8)return;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth=2;
    for(let i=0;i<6;i++){
      const sx=Math.random()*W, sy=Math.random()*GROUND_Y;
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx-20-speed*3,sy); ctx.stroke();
    }
  }

  function drawParticles(ctx, parts) {
    parts.forEach(p=>{
      ctx.fillStyle = p.color || '#000';
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }

  return { W, H, GROUND_Y, drawSky, drawGround, drawPlayer, drawThief, drawObstacle, drawSpeedLines, drawParticles };
})();
