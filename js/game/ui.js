/**
 * 游戏 HUD — Win98 风格
 */
const GameUI = (() => {
  const { GROUND_Y } = Renderer;
  const B = '#000', W = '#fff', NAVY = '#000080', GRAY = '#c0c0c0', TEAL = '#008080';

  function draw(ctx, gs) {
    const { state, score, lives, player, thief, abilities, stolenNotes,
            speedUpWarning, speedUpBuffer, currentTier, speedTiers, tierScores, speed, coins } = gs;
    const WW = 400;

    if (state === 'ready') {
      // Win98 dialog
      ctx.fillStyle = GRAY;
      ctx.fillRect(20, 180, WW-40, 260);
      ctx.fillStyle = W;
      ctx.fillRect(20, 180, WW-40, 2);
      ctx.fillRect(20, 180, 2, 260);
      ctx.fillStyle = '#404040';
      ctx.fillRect(20, 438, WW-40, 2);
      ctx.fillRect(WW-22, 180, 2, 260);
      // Title bar
      ctx.fillStyle = NAVY;
      ctx.fillRect(20, 180, WW-40, 22);
      ctx.fillStyle = W;
      ctx.font = 'bold 11px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ 小偷来袭', WW/2, 196);
      // Content
      ctx.fillStyle = B;
      ctx.font = 'bold 11px system-ui, sans-serif';
      const noteList = (stolenNotes || []).map(n => '《' + (n.title || '笔记') + '》').join(' ');
      ctx.fillText('偷走: ' + noteList, WW/2, 245);
      const catchSc = Thief.getCatchScore();
      const lv = Thief.getLevel();
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText('Lv.' + lv + ' | 需 ' + catchSc + ' 分追上', WW/2, 270);
      if (lv >= 2) { ctx.fillStyle = '#c00'; ctx.fillText('⚠ 小偷会丢石头！', WW/2, 295); }
      // OK button
      const bx = WW/2 - 40, by = 380;
      ctx.fillStyle = GRAY;
      ctx.fillRect(bx, by, 80, 28);
      ctx.fillStyle = W;
      ctx.fillRect(bx, by, 80, 2); ctx.fillRect(bx, by, 2, 28);
      ctx.fillStyle = '#404040';
      ctx.fillRect(bx, by+26, 80, 2); ctx.fillRect(bx+78, by, 2, 28);
      ctx.fillStyle = B;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('点击开始', WW/2, by+20);
      ctx.textAlign = 'start';
      return;
    }

    // Top HUD bar (Win98 taskbar)
    ctx.fillStyle = GRAY;
    ctx.fillRect(0, 0, WW, 42);
    ctx.fillStyle = W;
    ctx.fillRect(0, 0, WW, 2);
    ctx.fillStyle = '#404040';
    ctx.fillRect(0, 40, WW, 2);

    // Lives
    ctx.font = '12px system-ui';
    ctx.fillStyle = B;
    ctx.textAlign = 'left';
    for (let i = 0; i < lives; i++) {
      ctx.fillText('❤️', 8 + i * 20, 28);
    }

    // Catch score / chase status
    const catchSc = Thief.getCatchScore();
    const lv = Thief.getLevel();
    ctx.font = 'bold 10px system-ui, sans-serif';
    if (score < catchSc) {
      ctx.fillStyle = B;
      ctx.textAlign = 'center';
      ctx.fillText('Lv.'+lv+' 需'+ (catchSc-score) +'分', WW/2, 28);
      ctx.textAlign = 'left';
    } else {
      const dist = Math.max(0, (thief?.x || 600) - (player?.x || 90));
      const pct = Math.max(0, Math.min(1, dist / 500));
      const barX = 60, barY = 14, barW = 160, barH = 10;
      ctx.fillStyle = W;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = B; ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
      ctx.fillStyle = NAVY;
      ctx.fillRect(barX, barY, barW * (1-pct), barH);
      ctx.fillStyle = B;
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillText(Math.floor(dist/10)+'m', barX+barW+4, barY+10);
    }

    // Coins + Score
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillStyle = B;
    ctx.textAlign = 'right';
    ctx.fillText('💰' + (coins || 0) + ' 🏆' + score, WW - 8, 30);
    ctx.textAlign = 'left';

    // Abilities
    ctx.font = '8px "Press Start 2P", monospace';
    let abX = 8, abY = 54;
    if (abilities.includes('dash')) {
      const cd = player?.dashCooldown > 0 ? Math.ceil(player.dashCooldown/60)+'s' : '✓';
      ctx.fillStyle = player?.dashCooldown > 0 ? GRAY : B;
      ctx.fillText('💨'+cd, abX, abY); abX += 48;
    }
    if (abilities.includes('doubleJump')) {
      ctx.fillStyle = player?.hasDoubleJumped ? GRAY : B;
      ctx.fillText('🦘'+(player?.hasDoubleJumped?'✗':'✓'), abX, abY); abX += 48;
    }
    if (abilities.includes('slide')) {
      ctx.fillStyle = player?.isGliding ? C.red : B;
      ctx.fillText('🪂' + (player?.isGliding ? '滑' : '✓'), abX, abY);
    }

    // Speed-up warning
    if (speedUpWarning > 0) {
      const sec = Math.ceil(speedUpWarning / 60);
      ctx.fillStyle = 'rgba(255,255,0,0.9)';
      ctx.fillRect(0, GROUND_Y - 100, WW, 50);
      ctx.strokeStyle = B; ctx.lineWidth = 2;
      ctx.strokeRect(0, GROUND_Y - 100, WW, 50);
      ctx.fillStyle = B;
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      const nt = currentTier + 1;
      const ns = speedTiers ? speedTiers[nt] : '?';
      ctx.fillText('⚡ 加速! '+speed.toFixed(1)+'→'+ns+'  '+sec+'s', WW/2, GROUND_Y-70);
      ctx.textAlign = 'left';
    }
    if (speedUpBuffer > 0) {
      const sec = Math.ceil(speedUpBuffer / 60);
      ctx.fillStyle = 'rgba(0,128,0,0.8)';
      ctx.fillRect(0, GROUND_Y - 80, WW, 30);
      ctx.fillStyle = W;
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🛡 安全 '+sec+'s', WW/2, GROUND_Y-58);
      ctx.textAlign = 'left';
    }
  }

  function drawPause(ctx, errMsg) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, 400, 700);
    // Win98 dialog
    const dx = 80, dy = 260;
    ctx.fillStyle = GRAY;
    ctx.fillRect(dx, dy, 240, 120);
    ctx.fillStyle = W;
    ctx.fillRect(dx, dy, 240, 2); ctx.fillRect(dx, dy, 2, 120);
    ctx.fillStyle = '#404040';
    ctx.fillRect(dx, dy+118, 240, 2); ctx.fillRect(dx+238, dy, 2, 120);
    ctx.fillStyle = NAVY;
    ctx.fillRect(dx, dy, 240, 20);
    ctx.fillStyle = W;
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⏸ 暂停中', 200, dy+15);
    ctx.fillStyle = B;
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillText('点击画面继续', 200, dy+70);
    if (errMsg) {
      ctx.fillStyle = '#c00';
      ctx.font = '7px monospace';
      ctx.fillText('ERR: '+errMsg, 200, dy+100);
    }
    ctx.textAlign = 'start';
  }

  return { draw, drawPause };
})();
