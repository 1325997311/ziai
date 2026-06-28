/**
 * 笔记管理 — CRUD 操作
 */

const Notes = (() => {
  function create(title, content, fontFamily, effect) {
    const note = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'n' + Date.now() + Math.random().toString(36).slice(2),
      title: title || '未命名笔记',
      content: content || '',
      fontFamily: fontFamily || 'system-ui',
      effect: effect || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const notes = Storage.readNotes();
    notes.unshift(note);
    Storage.writeNotes(notes);
    return note;
  }

  function update(id, updates) {
    const notes = Storage.readNotes();
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return null;
    notes[idx] = { ...notes[idx], ...updates, updatedAt: Date.now() };
    Storage.writeNotes(notes);
    return notes[idx];
  }

  function remove(id) {
    const notes = Storage.readNotes();
    const filtered = notes.filter(n => n.id !== id);
    if (filtered.length === notes.length) return false;
    Storage.writeNotes(filtered);
    return true;
  }

  function getAll() {
    return Storage.readNotes();
  }

  function getById(id) {
    return Storage.readNotes().find(n => n.id === id);
  }

  function count() {
    return Storage.readNotes().length;
  }

  function randomPick() {
    const notes = Storage.readNotes();
    if (notes.length === 0) return null;
    return notes[Math.floor(Math.random() * notes.length)];
  }

  return { create, update, remove, getAll, getById, count, randomPick };
})();
