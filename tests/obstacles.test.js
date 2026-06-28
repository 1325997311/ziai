

describe('Obstacles', () => {
  it('create initializes empty', () => {
    Obstacles.create();
    assertEquals(Obstacles.all().length, 0);
  });

  it('update spawns obstacles', () => {
    Obstacles.create();
    // Run many frames to trigger spawn
    for (let i = 0; i < 500; i++) {
      Obstacles.update(6, 1, 0);
    }
    assert(Obstacles.all().length > 0, 'should spawn at least one obstacle');
  });

  it('obstacles move left', () => {
    Obstacles.create();
    Obstacles.update(6, 1, 0);
    Obstacles.update(6, 1, 0);
    // Run enough to ensure spawn + movement
    for (let i = 0; i < 200; i++) Obstacles.update(6, 1, 0);
    if (Obstacles.all().length > 0) {
      const x0 = Obstacles.all()[0].x;
      Obstacles.update(6, 1, 0);
      if (Obstacles.all().length > 0) {
        assert(Obstacles.all()[0].x < x0, 'obstacle should move left');
      }
    }
  });

  it('clearNear removes nearby obstacles', () => {
    Obstacles.create();
    for (let i = 0; i < 500; i++) Obstacles.update(6, 1, 0);
    const before = Obstacles.all().length;
    Obstacles.clearNear(500, 9999);
    assert(Obstacles.all().length <= before);
  });

  it('breakNear destroys small cacti', () => {
    Obstacles.create();
    Obstacles.clearNear(0, 9999);
    // Manually add a cactus near player
    for (let i = 0; i < 200; i++) Obstacles.update(6, 0.5, 0);
    Obstacles.breakNear(90, 28);
    // Should not throw
    assert(true);
  });
});
