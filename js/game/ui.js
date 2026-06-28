/**
 * 游戏 HUD — 黑白风格
 */
const GameUI = (() => {
  const { GROUND_Y } = Renderer;
  const B = '#000', W = '#fff';

  function draw(ctx, gs) {
    const { state, score, lives, player, thief, abilities, stolenNote,
            speedUpWarning, speedUpBuffer, currentTier, speedTiers, tierScores, speed } = gs;
    const WW = 400;

    if (state === 'ready') {
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillRect(0, 0, WW, 700);
      ctx.fillStyle = B;
      ctx.font = 'bold 22px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🦹 小偷正在偷走', WW/2, 260);
      ctx.font = 'bold 24px system-ui';
      ctx.fillText('《' + (stolenNote?.title || '空白笔记') + '》', WW/2, 300);
      ctx.font = '14px system-ui';
      ctx.fillStyle = '#555';
      ctx.fillText('坚持跑到 5000 分才能追上小偷！', WW/2, 350);
      ctx.font = '16px system-ui';
      ctx.fillText('点击屏幕开始', WW/2, 390);
      ctx.textAlign = 'start';
      return;
    }

    // Top bar
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(0, 0, WW, 44);
    ctx.strokeStyle = B;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(WW, 44); ctx.stroke();

    // Lives
    ctx.font = '16px system-ui';
    ctx.fillStyle = B;
    ctx.textAlign = 'left';
    for (let i = 0; i < lives; i++) {
      ctx.fillText('❤️', 8 + i * 22, 30);
    }

    // Status: chasing or waiting for score
    const catchScore = 5000;
    if (score < catchScore) {
      ctx.fillStyle = B;
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'center';
      const remaining = catchScore - score;
      ctx.fillText('🏃 坚持到 ' + catchScore + ' 分即可追上小偷！', WW/2, 42);
      ctx.fillText('还需 ' + remaining + ' 分', WW/2, 58);
      ctx.textAlign = 'left';
    } else {
      // Distance bar
      const dist = Math.max(0, (thief?.x || 600) - (player?.x || 90));
      const maxDist = 600;
      const pct = Math.max(0, Math.min(1, dist / maxDist));
      const barX = 70, barY = 14, barW = 200, barH = 12;
      ctx.strokeStyle = B; ctx.lineWidth = 1.5;
      ctx.strokeRect(barX, barY, barW, barH);
      ctx.fillStyle = B;
      ctx.fillRect(barX, barY, barW * (1 - pct), barH);
      ctx.fillStyle = B;
      ctx.font = '10px system-ui';
      ctx.fillText(Math.floor(dist / 10) + 'm', barX + barW + 6, barY + 12);
    }

    // Speed-up warning / buffer
    if (speedUpWarning > 0) {
      const sec = Math.ceil(speedUpWarning / 60);
      ctx.fillStyle = 'rgba(255,200,0,0.85)';
      ctx.fillRect(0, GROUND_Y - 140, WW, 90);
      ctx.fillStyle = B;
      ctx.font = 'bold 22px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ 前方加速！', WW/2, GROUND_Y - 100);
      ctx.font = '14px system-ui';
      const nextTier = currentTier + 1;
      const nextSpeed = speedTiers ? speedTiers[nextTier] : '?';
      ctx.fillText('速度 ' + speed.toFixed(1) + ' → ' + nextSpeed + ' | ' + sec + ' 秒后', WW/2, GROUND_Y - 75);
      ctx.textAlign = 'left';
    }
    if (speedUpBuffer > 0) {
      const sec = Math.ceil(speedUpBuffer / 60);
      ctx.fillStyle = 'rgba(0,200,100,0.8)';
      ctx.fillRect(0, GROUND_Y - 100, WW, 50);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️ 安全缓冲 ' + sec + ' 秒', WW/2, GROUND_Y - 66);
      ctx.textAlign = 'left';
    }

    // Score
    ctx.font = 'bold 16px system-ui';
    ctx.fillStyle = B;
    ctx.textAlign = 'right';
    ctx.fillText('🏆 ' + score, WW - 10, 30);

    // Abilities
    ctx.textAlign = 'left';
    ctx.font = '11px monospace';
    let abX = 10, abY = 56;
    if (abilities.includes('dash')) {
      const cd = player?.dashCooldown > 0 ? Math.ceil(player.dashCooldown / 60) + 's' : '✓';
      ctx.fillStyle = player?.dashCooldown > 0 ? '#aaa' : B;
      ctx.fillText('💨' + cd, abX, abY); abX += 50;
    }
    if (abilities.includes('doubleJump')) {
      const used = player?.hasDoubleJumped;
      ctx.fillStyle = used ? '#aaa' : B;
      ctx.fillText('🦘' + (used ? '✗' : '✓'), abX, abY); abX += 50;
    }
    if (abilities.includes('slide')) {
      ctx.fillStyle = B;
      ctx.fillText('⬇✓', abX, abY);
    }
    ctx.textAlign = 'start';
  }

  function drawPause(ctx, errMsg) {
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.fillRect(0, 0, 400, 700);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('⏸ 暂停中', 200, 310);
    ctx.font = '16px system-ui';
    ctx.fillStyle = '#555';
    ctx.fillText('点击画面继续', 200, 350);
    if (errMsg) {
      ctx.fillStyle = '#c00';
      ctx.font = '12px monospace';
      ctx.fillText('错误: ' + errMsg, 200, 390);
    }
    ctx.textAlign = 'start';
  }

  return { draw, drawPause };
})();
