
describe('Notes', () => {
  it('create returns a new note with id', () => {
    const n = Notes.create('标题', '内容', 'serif', 'neon');
    assertEquals(n.title, '标题');
    assertEquals(n.content, '内容');
    assert(n.id.length > 0);
    assert(n.createdAt > 0);
  });

  it('getAll returns sorted by updatedAt', () => {
    Notes.create('A', '');
    Notes.create('B', '');
    const all = Notes.getAll();
    assert(all.length >= 2);
    // newest first
    assert(all[0].updatedAt >= all[1].updatedAt);
  });

  it('update modifies existing note', () => {
    const n = Notes.create('Old', '');
    const u = Notes.update(n.id, { title: 'New' });
    assertEquals(u.title, 'New');
  });

  it('update returns null for missing id', () => {
    assert(Notes.update('nonexistent', {}) === null);
  });

  it('remove deletes note', () => {
    const n = Notes.create('X', '');
    const before = Notes.getAll().length;
    Notes.remove(n.id);
    assertEquals(Notes.getAll().length, before - 1);
  });

  it('count returns correct number', () => {
    const c1 = Notes.count();
    Notes.create('Test', '');
    assertEquals(Notes.count(), c1 + 1);
  });

  it('randomPick returns a note', () => {
    Notes.create('R1', '');
    Notes.create('R2', '');
    const picked = Notes.randomPick();
    assert(picked !== null);
    assert(picked.title);
  });

  it('randomPick returns null when empty', () => {
    // Clear all notes
    const all = Notes.getAll();
    all.forEach(n => Notes.remove(n.id));
    assert(Notes.randomPick() === null);
  });
});
