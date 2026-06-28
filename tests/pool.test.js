
describe('Pool', () => {
  it('acquire returns a new object', () => {
    const pool = Pool.create(() => ({ x: 0 }), (o) => { o.x = 0; }, 3);
    const obj = pool.acquire();
    assert(obj.x === 0);
  });

  it('release returns object to pool', () => {
    const pool = Pool.create(() => ({ x: 0 }), (o) => { o.x = 0; }, 2);
    const obj = pool.acquire();
    obj.x = 42;
    pool.release(obj);
    assertEquals(pool.size, 2);
    const reused = pool.acquire();
    assertEquals(reused.x, 0); // reset was called
  });

  it('releaseAll processes entire array', () => {
    const pool = Pool.create(() => ({ v: 0 }), (o) => { o.v = -1; }, 0);
    const arr = [{ v: 5 }, { v: 10 }];
    pool.releaseAll(arr);
    assertEquals(pool.size, 2);
    const o = pool.acquire();
    assertEquals(o.v, -1);
  });

  it('acquire from empty pool creates new', () => {
    const pool = Pool.create(() => ({ n: 1 }), () => {}, 0);
    assertEquals(pool.size, 0);
    const obj = pool.acquire();
    assertEquals(obj.n, 1);
  });
});
