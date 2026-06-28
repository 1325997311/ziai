/**
 * 游戏核心 — 竖屏跑酷追小偷
 */
const GameCore = (() => {
  const { W, H, GROUND_Y } = Renderer;

  let canvas, ctx;
  let state, player, particles;
  let speed, score, lives;
  let animId, lastTime;
  let abilities, stolenNotes;
  let onWin, onLose, onLifeLost;
  let flashAlpha = 0;
  let lastError = '';
  let worldOffset = 0;
  let catchScore = 5000;

  // 加速系统
  const SPEED_TIERS = [2.5, 3.5, 5, 6.5, 8, 10, 12];
  const TIER_SCORES  = [0, 30000, 70000, 120000, 180000, 260000, 360000];
  let currentTier = 0;
  let speedUpWarning = 0;   // >0: showing warning
  let speedUpBuffer  = 0;   // >0: no-obstacle buffer after speed-up
  const WARNING_FRAMES = 120; // 2s warning
  const BUFFER_FRAMES  = 180; // 3s buffer

  function init(canvasEl, opts) {
    if (animId) cancelAnimationFrame(animId);
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;
    abilities = opts.abilities || ['jump'];
    stolenNotes = opts.stolenNotes || [{ title: '空白笔记' }];
    catchScore = opts.catchScore || 25000;
    onWin = opts.onWin;
    onLose = opts.onLose;
    onLifeLost = opts.onLifeLost;

    GameInput.attach();
    Obstacles.create();
    Thief.create();
    Thief.init({ thiefLevel: opts.thiefLevel || 1, catchScore });

    state = 'ready';
    player = new Player.PlayerState(abilities);
    particles = [];
    speed = SPEED_TIERS[0];
    score = 0;
    lives = abilities.includes('extraLife') ? 2 : 1;
    flashAlpha = 0;
    lastError = '';
    worldOffset = 0;
    currentTier = 0;
    speedUpWarning = 0;
    speedUpBuffer = 0;

    drawFrame(0);
  }

  function start() {
    if (state === 'playing') return;
    state = 'playing';
    lastTime = performance.now();
    lastError = '';
    loop(lastTime);
  }

  function loop(ts) {
    if (state !== 'playing') { animId = null; return; }
    const dt = Math.min(ts - lastTime, 33);
    lastTime = ts;

    try { update(dt); } catch (e) {
      console.error('[Game] Update error:', e.message);
      lastError = e.message || 'unknown';
      state = 'paused';
      drawFrame(ts);
      animId = null;
      return;
    }

    drawFrame(ts);
    if (state === 'playing') animId = requestAnimationFrame(loop);
    else animId = null;
  }

  function update(dt) {
    const fm = dt / 16.67;

    const thiefObj = Thief.get();
    if (!thiefObj || !player) return;

    const playerWorldX = worldOffset + 90;
    const thiefWorldX = thiefObj.x;
    const dist = thiefWorldX - playerWorldX;

    // ---- 加速阶梯系统 ----
    if (currentTier < SPEED_TIERS.length - 1) {
      const nextScore = TIER_SCORES[currentTier + 1];
      if (speedUpWarning > 0) {
        // 正在警告中
        speedUpWarning--;
        if (speedUpWarning === 0) {
          // 加速！
          currentTier++;
          speed = SPEED_TIERS[currentTier];
          speedUpBuffer = BUFFER_FRAMES;
          Obstacles.clearNear(90, 600); // 清空所有障碍物
        }
      } else if (speedUpBuffer > 0) {
        // 缓冲期（无障碍物）
        speedUpBuffer--;
      } else if (score >= nextScore - 200) {
        // 接近下一档 → 开始警告
        speedUpWarning = WARNING_FRAMES;
      }
    }

    // World scroll
    worldOffset += speed * fm;

    // Input
    if (GameInput.consumeJump()) player.jump();
    if (GameInput.isSlideHeld()) player.slide();
    if (GameInput.consumeDash()) player.dash();
    if (GameInput.consumePause()) { state = 'paused'; return; }

    player.update(speed / 2.5); // scale physics with speed
    Thief.update(speed, worldOffset, score, fm);
    // 缓冲期不生成障碍物
    if (speedUpWarning === 0 && speedUpBuffer === 0) {
      Obstacles.update(speed, fm, score);
    } else {
      // 只移动现有障碍物，不生成新的
      Obstacles.updateMoveOnly(speed, fm);
    }

    // Collisions
    if (!player.invincible && player.dashTimer === 0) {
      const ph = { x: 90, y: player.y, w: player.w, h: player.h };
      let hit = false;

      // Ground obstacles
      for (const obs of Obstacles.all()) {
        if (!obs || obs.x + obs.w < 90 || obs.x > 90 + player.w) continue;
        if (ph.x < obs.x + obs.w && ph.x + ph.w > obs.x &&
            ph.y < obs.y + obs.h && ph.y + ph.h > obs.y) { hit = true; break; }
      }

      // Thief-thrown rocks
      if (!hit && Thief.checkRockCollision(90, player.w, player.y, player.h)) {
        hit = true;
      }

      if (hit && player.die()) {
        lives--;
        if (lives <= 0) {
          state = 'lost';
          if (onLose) onLose({ score, stolenNotes, reason: 'dead' });
          return;
        } else {
          if (onLifeLost) onLifeLost({ lives, score });
          flashAlpha = 0.6;
          player.reset(abilities);
          player.invincible = true;
          player.invincibleTimer = 120;
          Obstacles.clearNear(90, 200);
        }
      }
    }

    if (player.dashTimer > 0) Obstacles.breakNear(90, player.w);

    score += Math.floor(10 * fm);

    if (score >= catchScore && playerWorldX >= thiefWorldX - 25) {
      state = 'won';
      score += 500;
      if (stolenNotes.length > 0) score += stolenNotes.reduce((s,n) => s + (n.content||'').length, 0);
      if (onWin) onWin({ score, stolenNotes });
      return;
    }

    if (dist > W * 3) {
      state = 'lost';
      if (onLose) onLose({ score, stolenNotes, reason: 'escaped' });
      return;
    }

    particles = particles.filter(p => { p.life--; return p.life > 0; });
  }

  function drawFrame(ts) {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const scrollX = worldOffset;

    try { Renderer.drawSky(ctx, scrollX); } catch(e) {}
    try { Renderer.drawGround(ctx, scrollX); } catch(e) {}

    try { for (const o of Obstacles.all()) Renderer.drawObstacle(ctx, o); } catch(e) {}
    // Thrown rocks (ground obstacles from thief)
    try {
      for (const r of Thief.getThrownRocks()) {
        Renderer.drawObstacle(ctx, { type: 'rock', x: r.x, y: r.y, w: r.w, h: r.h });
      }
    } catch(e) {}

    try {
      const t = Thief.getScreenPos(worldOffset);
      if (t && t.x !== undefined) {
        Renderer.drawThief(ctx, t);
        // Throw animation: rock above thief's head
        const ta = Thief.getThrowAnim();
        if (ta > 0) {
          const bob = Math.sin(t.frame*0.8)*2;
          ctx.fillStyle = '#fff';
          ctx.fillRect(t.x + 25, t.y + bob - 20, 14, 14);
          ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
          ctx.strokeRect(t.x + 25, t.y + bob - 20, 14, 14);
          ctx.fillStyle = '#000';
          ctx.fillRect(t.x + 29, t.y + bob - 17, 4, 3);
          // Arm
          ctx.fillStyle = '#000';
          ctx.fillRect(t.x + 20, t.y + bob - 6, 7, 6);
        }
        if (score < catchScore) {
          ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(t.x - 4, t.y - 4, t.w + 8, t.h + 8);
          ctx.setLineDash([]);
        }
      }
    } catch(e) { console.warn('drawThief error:', e); }

    try { if (player) Renderer.drawPlayer(ctx, { ...player, x: 90 }); } catch(e) {}
    try { Renderer.drawSpeedLines(ctx, speed); } catch(e) {}

    try {
      const t = Thief.get();
      GameUI.draw(ctx, {
        state, score, lives,
        player: { x: worldOffset + 90, y: player?.y || 0 },
        thief: t || { x: worldOffset + 600 },
        speed, abilities: abilities || [],
        stolenNotes: stolenNotes || [],
        speedUpWarning, speedUpBuffer,
        currentTier, speedTiers: SPEED_TIERS, tierScores: TIER_SCORES,
      });
    } catch(e) {}

    if (state === 'paused') GameUI.drawPause(ctx, lastError);

    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,0,0,${flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
      flashAlpha -= 0.05;
      if (flashAlpha < 0) flashAlpha = 0;
    }
  }

  function resume() {
    if (state !== 'paused') return;
    state = 'playing'; lastTime = performance.now(); lastError = '';
    loop(lastTime);
  }

  function pause() { if (state === 'playing') state = 'paused'; }
  function getState() { return state; }

  function destroy() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    GameInput.detach(); GameInput.reset();
  }

  return { init, start, resume, pause, destroy, getState };
})();
