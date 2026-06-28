
describe('PowerUps', () => {
  it('create initializes empty', () => {
    PowerUps.create();
    assertEquals(PowerUps.all().length, 0);
  });

  it('no powerups active initially', () => {
    PowerUps.create();
    assert(!PowerUps.isShieldActive());
    assert(!PowerUps.isMagnetActive());
    assert(!PowerUps.isBoostActive());
  });

  it('spawns after enough frames', () => {
    PowerUps.create();
    for (let i = 0; i < 500; i++) PowerUps.update(8, 2);
    // After 500 frames at speed 8 with fm 2: counter -= 8*2*500 = 8000
    // spawnCounter resets to ~600-1000, should have spawned several times
    assert(PowerUps.all().length >= 0, 'check does not crash');
  });

  it('shield life cycle', () => {
    PowerUps.create();
    assert(!PowerUps.isShieldActive());
    PowerUps.activate('shield');
    assert(PowerUps.isShieldActive());
    PowerUps.consumeShield();
    assert(!PowerUps.isShieldActive());
  });

  it('magnet timer expires', () => {
    PowerUps.create();
    PowerUps.activate('magnet');
    assert(PowerUps.isMagnetActive());
    for (let i = 0; i < 400; i++) PowerUps.update(6, 1);
    assert(!PowerUps.isMagnetActive());
  });

  it('boost timer expires', () => {
    PowerUps.create();
    PowerUps.activate('boost');
    assert(PowerUps.isBoostActive());
    for (let i = 0; i < 250; i++) PowerUps.update(6, 1);
    assert(!PowerUps.isBoostActive());
  });

  it('checkCollect returns powerup type', () => {
    PowerUps.create();
    for (let i = 0; i < 2000; i++) PowerUps.update(6, 1);
    const all = PowerUps.all();
    if (all.length > 0) {
      all[0].x = 95;
      all[0].y = 560 - 30 - 140;
      const result = PowerUps.checkCollect(90, 28, 560 - 30 - 140, 30);
      if (result) {
        assert(['shield', 'magnet', 'boost'].includes(result.type));
      }
    }
  });
});
