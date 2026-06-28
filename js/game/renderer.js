/**
 * 渲染器 — 竖屏黑白像素风
 */
const Renderer = (() => {
  const W = 400, H = 700;
  const GROUND_Y = 560;
  const C = { black: '#000', white: '#fff', gray: '#888', lgray: '#ccc', dgray: '#333' };

  function drawSky(ctx, scrollX) {
    // White sky
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, GROUND_Y);

    // Black stars (small dots)
    ctx.fillStyle = C.black;
    [[30,40,1],[80,100,1],[150,30,1.5],[220,80,1],[290,50,1.5],[350,90,1],[60,160,1],[180,140,1.5],[320,120,1],[400,60,1.5]].forEach(([sx,sy,sr]) => {
      const px = ((sx - scrollX * 0.08) % W + W) % W;
      ctx.beginPath(); ctx.arc(px, sy, sr, 0, Math.PI*2); ctx.fill();
    });

    // Moon outline
    const mx = ((300 - scrollX * 0.03) % (W + 150)) - 75;
    ctx.strokeStyle = C.black;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mx, 65, 30, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(mx + 10, 58, 24, 0, Math.PI*2); ctx.fill();

    // Clouds (outline style)
    ctx.strokeStyle = C.dgray;
    ctx.lineWidth = 1.5;
    drawCloud(ctx, 50, 120, 0.7, scrollX * 0.1);
    drawCloud(ctx, 250, 150, 0.9, scrollX * 0.08);
  }

  function drawCloud(ctx, bx, by, s, off) {
    const x = ((bx - off) % (W + 200)) - 100;
    ctx.save(); ctx.translate(x, by); ctx.scale(s, s);
    ctx.beginPath();
    ctx.arc(0,0,22,0,Math.PI*2); ctx.arc(26,-8,18,0,Math.PI*2);
    ctx.arc(48,0,22,0,Math.PI*2); ctx.arc(18,5,20,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  function drawGround(ctx, scrollX) {
    const TW = 32;
    const start = Math.floor(scrollX / TW);
    for (let i = 0; i < Math.ceil(W/TW)+2; i++) {
      const tx = (start+i)*TW - scrollX;
      if (tx < -TW || tx > W) continue;
      // White ground with black border
      ctx.fillStyle = '#fff';
      ctx.fillRect(tx, GROUND_Y, TW, H-GROUND_Y);
      ctx.fillStyle = C.black;
      ctx.fillRect(tx, GROUND_Y, TW, 3);
      // Brick pattern
      if ((start+i) % 3 === 0) {
        ctx.fillStyle = C.lgray;
        ctx.fillRect(tx + 4, GROUND_Y + 8, TW - 8, 2);
        ctx.fillRect(tx + 14, GROUND_Y + 20, TW - 28, 2);
      }
    }
  }

  // ====== RABBIT (B&W pixel) ======
  function drawPlayer(ctx, p) {
    if (p.invincible && Math.floor(Date.now()/100)%2===0) return;
    const {x,y,w,h,state,frame} = p;
    ctx.save(); ctx.translate(x, y);

    // Trail during dash
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
    const b = '#000', w = '#fff';
    const earWiggle = state === 'running' ? Math.sin(frame * 1.2) * 2 : 0;

    if (state === 'sliding') {
      // Sliding rabbit — stretched low, ears back
      // Ears flat back
      ctx.fillStyle = b;
      ctx.fillRect(ox + 3, oy + 8, 18, 4);
      ctx.fillRect(ox + 1, oy + 7, 5, 3);
      // Body (long & low)
      ctx.fillStyle = w;
      ctx.fillRect(ox + 2, oy + 12, 22, 11);
      ctx.strokeStyle = b; ctx.lineWidth = 1.5;
      ctx.strokeRect(ox + 2, oy + 12, 22, 11);
      // Eye
      ctx.fillStyle = b;
      ctx.fillRect(ox + 4, oy + 14, 2, 2);
      // Tail
      ctx.fillStyle = w;
      ctx.fillRect(ox + 24, oy + 14, 4, 4);
      ctx.strokeStyle = b;
      ctx.strokeRect(ox + 24, oy + 14, 4, 4);
    } else {
      // Ears (tall, signature rabbit feature)
      ctx.fillStyle = w;
      ctx.fillRect(ox + 6, oy + bob - 14 + earWiggle, 5, 16);
      ctx.fillRect(ox + 15, oy + bob - 14 - earWiggle, 5, 16);
      ctx.strokeStyle = b; ctx.lineWidth = 1.5;
      ctx.strokeRect(ox + 6, oy + bob - 14 + earWiggle, 5, 16);
      ctx.strokeRect(ox + 15, oy + bob - 14 - earWiggle, 5, 16);
      // Inner ear
      ctx.fillStyle = b;
      ctx.fillRect(ox + 7, oy + bob - 10 + earWiggle, 3, 8);
      ctx.fillRect(ox + 16, oy + bob - 10 - earWiggle, 3, 8);

      // Head
      ctx.fillStyle = w;
      ctx.fillRect(ox + 5, oy + bob + 1, 18, 13);
      ctx.strokeStyle = b; ctx.lineWidth = 1.5;
      ctx.strokeRect(ox + 5, oy + bob + 1, 18, 13);
      // Eye
      ctx.fillStyle = b;
      ctx.fillRect(ox + 8, oy + bob + 4, 3, 3);
      // Nose
      ctx.fillStyle = b;
      ctx.fillRect(ox + 4, oy + bob + 7, 2, 1);

      // Body
      const bodyLean = state === 'dashing' ? 2 : 0;
      ctx.fillStyle = w;
      ctx.fillRect(ox + 3 + bodyLean, oy + bob + 14, 22, 14);
      ctx.strokeStyle = b; ctx.lineWidth = 1.5;
      ctx.strokeRect(ox + 3 + bodyLean, oy + bob + 14, 22, 14);

      // Legs
      const legPhase = Math.sin(frame * 0.8) * (state === 'running' ? 3 : 1);
      ctx.fillStyle = w;
      ctx.fillRect(ox + 5, oy + bob + 28 + legPhase, 8, 5);
      ctx.fillRect(ox + 13, oy + bob + 28 - legPhase, 8, 5);
      ctx.strokeStyle = b; ctx.lineWidth = 1;
      ctx.strokeRect(ox + 5, oy + bob + 28 + legPhase, 8, 5);
      ctx.strokeRect(ox + 13, oy + bob + 28 - legPhase, 8, 5);

      // Tail (fluffy circle)
      ctx.fillStyle = w;
      ctx.beginPath();
      ctx.arc(ox + 27 + bodyLean, oy + bob + 20, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = b; ctx.lineWidth = 1;
      ctx.stroke();

      // Dash effect
      if (state === 'dashing') {
        ctx.fillStyle = b;
        ctx.fillRect(ox - 6, oy + 18, 4, 8);
        ctx.fillRect(ox - 10, oy + 20, 3, 4);
      }
    }
  }

  // ====== THIEF (B&W) ======
  function drawThief(ctx, t) {
    const {x,y,state,frame} = t;
    ctx.save(); ctx.translate(x, y);
    const bob = Math.sin(frame*0.8)*2;
    const b = '#000', w = '#fff';

    // Body
    ctx.fillStyle = b;
    ctx.fillRect(6, bob + 13, 18, 14);
    // Head
    ctx.fillStyle = w;
    ctx.fillRect(10, bob + 2, 12, 12);
    ctx.strokeStyle = b; ctx.lineWidth = 1.5;
    ctx.strokeRect(10, bob + 2, 12, 12);
    // Mask
    ctx.fillStyle = b;
    ctx.fillRect(8, bob + 5, 16, 5);
    // Eye hole
    ctx.fillStyle = w;
    ctx.fillRect(12, bob + 6, 3, 2);
    // Scroll (stolen note)
    ctx.fillStyle = w;
    ctx.fillRect(2, bob + 12, 6, 10);
    ctx.strokeStyle = b; ctx.lineWidth = 1;
    ctx.strokeRect(2, bob + 12, 6, 10);
    // Legs
    const lp = Math.sin(frame*0.8)*4;
    ctx.fillStyle = b;
    ctx.fillRect(10, bob + 27 + lp, 5, 5);
    ctx.fillRect(17, bob + 27 - lp, 5, 5);

    if (state==='taunting') {
      ctx.fillStyle = w;
      ctx.fillRect(14, 14, 6, 2);
    }
    if (state==='panicking') {
      ctx.fillStyle = b;
      ctx.fillRect(8, -3, 4, 6);
      ctx.fillRect(12, -4, 4, 7);
      ctx.fillRect(16, -3, 4, 6);
    }
    ctx.restore();
  }

  // ====== OBSTACLES (B&W) ======
  function drawObstacle(ctx, obs) {
    const {x,y,w,h,type} = obs;
    ctx.lineWidth = 1.5;
    switch(type) {
      case 'cactus_small':
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000';
        ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x+2, y-8, 3, 8); ctx.strokeRect(x+2, y-8, 3, 8);
        ctx.fillStyle = '#000';
        ctx.fillRect(x+4, y+4, 2, h-8);
        break;
      case 'cactus_large':
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000';
        ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x+3, y-15, 3, 15); ctx.strokeRect(x+3, y-15, 3, 15);
        ctx.fillStyle = '#000';
        ctx.fillRect(x+4, y+4, 2, h-8);
        break;
      case 'rock':
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(x, y+h); ctx.lineTo(x+3, y+3);
        ctx.lineTo(x+w/2, y); ctx.lineTo(x+w-3, y+3);
        ctx.lineTo(x+w, y+h); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.fillRect(x+8, y+4, 3, 2);
        break;
      case 'bird':
        const wu = Math.sin(Date.now()/100)>0;
        ctx.fillStyle = '#000';
        ctx.fillRect(x+2, y+(wu?2:6), w-4, 6);
        ctx.fillRect(x, y+4, w, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x+w-7, y+5, 2, 1);
        break;
      case 'bat':
        ctx.fillStyle = '#000';
        ctx.fillRect(x+3, y+2, w-6, 8);
        ctx.fillRect(x, y+6, w, 4);
        break;
      case 'wall':
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000';
        ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
        ctx.strokeStyle = '#000';
        for(let by=y; by<y+h; by+=10) {
          ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x+w, by); ctx.stroke();
        }
        break;
      case 'crack':
        ctx.fillStyle = '#000';
        ctx.fillRect(x, GROUND_Y, w, 8);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x+2, GROUND_Y, w-4, 8);
        break;
    }
  }

  function drawSpeedLines(ctx, speed) {
    if(speed<8)return;
    ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=2;
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
