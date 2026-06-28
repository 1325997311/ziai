
describe('CONFIG', () => {
  it('has all required sections', () => {
    assert(CONFIG.CANVAS_W === 400);
    assert(CONFIG.CANVAS_H === 700);
    assert(CONFIG.GROUND_Y === 560);
    assert(CONFIG.BASE_SPEED === 2.5);
    assert(CONFIG.GRAVITY > 0);
    assert(CONFIG.JUMP_VEL < 0);
    assert(Array.isArray(CONFIG.SPEED_TIERS));
    assert(Array.isArray(CONFIG.THIEF_CATCH_SCORES));
  });

  it('speed tiers are ascending', () => {
    for (let i = 1; i < CONFIG.SPEED_TIERS.length; i++) {
      assert(CONFIG.SPEED_TIERS[i] > CONFIG.SPEED_TIERS[i-1], 'tier ' + i + ' not ascending');
    }
  });

  it('catch scores are ascending', () => {
    for (let i = 1; i < CONFIG.THIEF_CATCH_SCORES.length; i++) {
      assert(CONFIG.THIEF_CATCH_SCORES[i] > CONFIG.THIEF_CATCH_SCORES[i-1]);
    }
  });
});
