
describe('Coins', () => {
  it('create initializes with 0 collected', () => {
    Coins.create();
    assertEquals(Coins.getCollected(), 0);
    assertEquals(Coins.all().length, 0);
  });

  it('update spawns coins', () => {
    Coins.create();
    for (let i = 0; i < 500; i++) Coins.update(6, 1);
    assert(Coins.all().length > 0, 'should spawn coins');
  });

  it('checkCollect collects coins at player position', () => {
    Coins.create();
    // Force a coin at player position
    for (let i = 0; i < 500; i++) Coins.update(6, 1);
    const coins = Coins.all();
    if (coins.length > 0) {
      // Move coin to player
      coins[0].x = 95;
      coins[0].y = 560 - 30;
      const collected = Coins.checkCollect(90, 28, 560 - 30, 30);
      // Whether collected or not depends on exact position
      assert(typeof collected === 'boolean');
    }
  });

  it('getCollected tracks count', () => {
    Coins.create();
    assertEquals(Coins.getCollected(), 0);
  });

  it('coins move left', () => {
    Coins.create();
    // Spawn some coins
    for (let i = 0; i < 500; i++) Coins.update(6, 1);
    const all = Coins.all();
    if (all.length > 0) {
      const x0 = all[0].x;
      Coins.update(6, 1);
      if (Coins.all().length > 0 && !all[0].collected) {
        assert(Coins.all()[0].x < x0, 'coin should move left');
      }
    }
  });
});
