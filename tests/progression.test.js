
describe('Progression', () => {
  it('0 notes → only jump unlocked', () => {
    const a = Progression.getAbilities(0);
    assertDeepEquals(a, ['jump']);
  });

  it('10 notes → slide unlocked', () => {
    const a = Progression.getAbilities(10);
    assert(a.includes('slide'));
    assert(a.includes('jump'));
  });

  it('30 notes → doubleJump unlocked', () => {
    const a = Progression.getAbilities(30);
    assert(a.includes('doubleJump'));
    assert(a.includes('slide'));
  });

  it('50 notes → dash unlocked', () => {
    const a = Progression.getAbilities(50);
    assert(a.includes('dash'));
  });

  it('100 notes → extraLife unlocked', () => {
    const a = Progression.getAbilities(100);
    assert(a.includes('extraLife'));
  });

  it('checkNewUnlocks detects crossing thresholds', () => {
    const r = Progression.checkNewUnlocks(9, 10);
    assertEquals(r.length, 1);
    assertEquals(r[0].ability, 'slide');
  });

  it('getNextUnlock returns correct next threshold', () => {
    const n = Progression.getNextUnlock(5);
    assertEquals(n.ability, 'slide');
    assertEquals(n.count, 10);
  });

  it('all thresholds defined', () => {
    assertEquals(Progression.THRESHOLDS.length, 5);
  });
});
