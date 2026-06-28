/**
 * 游戏核心 — 主循环 + 状态管理 + 碰撞
 */
const GameCore = (() => {
  const {
    CANVAS_W: W, CANVAS_H: H, GROUND_Y,
    BASE_SPEED, PLAYER_X,
    SPEED_TIERS, SPEED_TIER_SCORES,
    SPEED_WARNING_FRAMES, SPEED_BUFFER_FRAMES, SPEED_WARNING_AHEAD,
    SCORE_PER_FRAME, SCORE_WIN_BONUS, INVINCIBLE_AFTER_HIT,
  } = CONFIG;

  let canvas, ctx;
  let state, player, particles;
  let speed, score, lives;
  let animId, lastTime;
  let abilities, stolenNotes;
  let flashAlpha = 0;
  let lastError = '';
  let worldOffset = 0;
  let catchScore = CONFIG.THIEF_CATCH_SCORES[1];

  let currentTier = 0;
  let speedUpWarning = 0;
  let speedUpBuffer = 0;

  function init(canvasEl, opts) {
    if (animId) cancelAnimationFrame(animId);
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;
    abilities   = opts.abilities || ['jump'];
    stolenNotes = opts.stolenNotes || [{ title: '空白笔记' }];
    catchScore  = opts.catchScore || CONFIG.THIEF_CATCH_SCORES[1];

    GameInput.attach();
    Obstacles.create();
    Thief.create();
    Thief.init({ thiefLevel: opts.thiefLevel || 1, catchScore });

    state        = 'ready';
    player       = new Player.PlayerState(abilities);
    particles    = [];
    speed        = SPEED_TIERS[0];
    score        = 0;
    lives        = abilities.includes('extraLife') ? 2 : 1;
    flashAlpha   = 0;
    lastError    = '';
    worldOffset  = 0;
    currentTier  = 0;
    speedUpWarning = 0;
    speedUpBuffer  = 0;

    drawFrame(0);
  }

  let countdown = 0; // 3→2→1→GO

  function start() {
    if (state === 'playing') return;
    countdown = 3;
    state = 'countdown';
    lastTime = performance.now();
    lastError = '';
    // Show countdown then start
    const tick = () => {
      if (countdown > 0) {
        drawFrame(lastTime);
        countdown--;
        setTimeout(tick, 500);
      } else {
        state = 'playing';
        loop(performance.now());
      }
    };
    tick();
  }

  function loop(ts) {
    if (state !== 'playing') { animId = null; return; }
    const dt = Math.min(ts - lastTime, 33);
    lastTime = ts;
    try { update(dt); } catch (e) {
      console.error('[Game]', e.message);
      lastError = e.message || '';
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

    const playerWorldX = worldOffset + PLAYER_X;
    const thiefWorldX = thiefObj.x;
    const dist = thiefWorldX - playerWorldX;

    // ---- Speed tiers ----
    if (currentTier < SPEED_TIERS.length - 1) {
      const nextScore = SPEED_TIER_SCORES[currentTier + 1];
      if (speedUpWarning > 0) {
        speedUpWarning--;
        if (speedUpWarning === 0) {
          currentTier++;
          speed = SPEED_TIERS[currentTier];
          speedUpBuffer = SPEED_BUFFER_FRAMES;
          Obstacles.clearNear(PLAYER_X, 9999);
          Thief.clearRocks();
        }
      } else if (speedUpBuffer > 0) {
        speedUpBuffer--;
      } else if (score >= nextScore - SPEED_WARNING_AHEAD) {
        speedUpWarning = SPEED_WARNING_FRAMES;
      }
    }

    // Time-based speed (gradual ramp within tier)
    const timeSpeed = SPEED_TIERS[currentTier];
    const proximitySpeed = Math.max(0, (200 - dist) / 200) * 6;
    speed = timeSpeed + proximitySpeed;

    // Advance world
    worldOffset += speed * fm;

    // Input
    if (GameInput.consumeJump()) player.jump();
    if (GameInput.isSlideHeld()) player.slide();
    if (GameInput.consumeDash()) player.dash();
    if (GameInput.consumePause()) { state = 'paused'; return; }

    // Update entities
    player.update(speed / BASE_SPEED);
    Thief.update(speed, worldOffset, score, fm, speedUpBuffer > 0);
    if (speedUpWarning === 0 && speedUpBuffer === 0) {
      Obstacles.update(speed, fm, score);
    } else {
      Obstacles.updateMoveOnly(speed, fm);
    }

    // Collisions
    if (!player.invincible && player.dashTimer === 0) {
      let hit = false;
      const ph = { x: PLAYER_X, y: player.y, w: player.w, h: player.h };
      for (const obs of Obstacles.all()) {
        if (!obs || obs.x + obs.w < PLAYER_X || obs.x > PLAYER_X + player.w) continue;
        if (ph.x < obs.x + obs.w && ph.x + ph.w > obs.x &&
            ph.y < obs.y + obs.h && ph.y + ph.h > obs.y) { hit = true; break; }
      }
      if (!hit && Thief.checkRockCollision(PLAYER_X, player.w, player.y, player.h)) {
        hit = true;
      }
      if (hit && player.die()) {
        lives--;
        if (lives <= 0) {
          state = 'lost';
          EventBus.emit('game:lose', { score, stolenNotes, reason: 'dead' });
          return;
        } else {
          EventBus.emit('game:lifeLost', { lives, score });
          flashAlpha = 0.6;
          player.reset(abilities);
          player.invincible = true;
          player.invincibleTimer = INVINCIBLE_AFTER_HIT;
          Obstacles.clearNear(PLAYER_X, 200);
        }
      }
    }

    if (player.dashTimer > 0) Obstacles.breakNear(PLAYER_X, player.w);

    score += Math.floor(SCORE_PER_FRAME * fm);

    if (score >= catchScore && playerWorldX >= thiefWorldX - 25) {
      state = 'won';
      score += SCORE_WIN_BONUS;
      if (stolenNotes.length > 0) score += stolenNotes.reduce((s,n) => s + (n.content||'').length, 0);
      EventBus.emit('game:win', { score, stolenNotes });
      return;
    }

    if (dist > W * 3) {
      state = 'lost';
      EventBus.emit('game:lose', { score, stolenNotes, reason: 'escaped' });
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
    // Thrown rocks
    try { for (const r of Thief.getThrownRocks()) Renderer.drawObstacle(ctx, { type:'rock', x:r.x, y:r.y, w:r.w, h:r.h }); } catch(e) {}
    // Thief
    try {
      const t = Thief.getScreenPos(worldOffset);
      if (t) {
        Renderer.drawThief(ctx, t);
        const ta = Thief.getThrowAnim();
        if (ta > 0) { drawThrowAnim(ctx, t, ta); }
        if (score < catchScore) { drawShield(ctx, t); }
      }
    } catch(e) {}
    // Player
    try { if (player) Renderer.drawPlayer(ctx, { ...player, x: PLAYER_X }); } catch(e) {}
    try { Renderer.drawSpeedLines(ctx, speed); } catch(e) {}
    // HUD
    try {
      GameUI.draw(ctx, {
        state, score, lives, countdown,
        player: { x: worldOffset + PLAYER_X, y: player?.y || 0 },
        thief: Thief.get() || {},
        speed, abilities: abilities || [],
        stolenNotes, speedUpWarning, speedUpBuffer,
        currentTier, speedTiers: SPEED_TIERS, tierScores: SPEED_TIER_SCORES,
        catchScore, thiefLevel: Thief.getLevel(),
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

  function drawThrowAnim(ctx, t, ta) {
    const bob = Math.sin(t.frame*0.8)*2;
    ctx.fillStyle = '#fff';
    ctx.fillRect(t.x + 25, t.y + bob - 20, 14, 14);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.strokeRect(t.x + 25, t.y + bob - 20, 14, 14);
    ctx.fillStyle = '#000';
    ctx.fillRect(t.x + 29, t.y + bob - 17, 4, 3);
    ctx.fillStyle = '#000';
    ctx.fillRect(t.x + 20, t.y + bob - 6, 7, 6);
  }

  function drawShield(ctx, t) {
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(t.x - 4, t.y - 4, t.w + 8, t.h + 8);
    ctx.setLineDash([]);
  }

  function resume() {
    if (state !== 'paused') return;
    state = 'playing'; lastTime = performance.now(); lastError = '';
    loop(lastTime);
  }
  function pause()    { if (state === 'playing') state = 'paused'; }
  function getState() { return state; }
  function destroy()  {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    GameInput.detach(); GameInput.reset();
  }

  return { init, start, resume, pause, destroy, getState };
})();
