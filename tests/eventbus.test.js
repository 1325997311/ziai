
describe('EventBus', () => {
  it('emit calls subscribed listeners', () => {
    let called = false;
    EventBus.on('test', (d) => { called = d; });
    EventBus.emit('test', true);
    assert(called === true);
  });

  it('off unsubscribes listener', () => {
    let count = 0;
    const fn = () => { count++; };
    EventBus.on('t2', fn);
    EventBus.emit('t2');
    EventBus.off('t2', fn);
    EventBus.emit('t2');
    assertEquals(count, 1);
  });

  it('on returns unsubscribe function', () => {
    let count = 0;
    const unsub = EventBus.on('t3', () => { count++; });
    EventBus.emit('t3');
    unsub();
    EventBus.emit('t3');
    assertEquals(count, 1);
  });

  it('emit without listeners does not throw', () => {
    EventBus.emit('nonexistent', {});
    assert(true); // no throw = pass
  });

  it('listener errors are caught', () => {
    EventBus.on('err', () => { throw new Error('oops'); });
    EventBus.emit('err'); // should not throw
    assert(true);
  });

  it('clear removes all listeners', () => {
    let c = 0;
    EventBus.on('x', () => { c++; });
    EventBus.clear();
    EventBus.emit('x');
    assertEquals(c, 0);
  });
});
