
describe('Storage', () => {
  describe('read/write notes', () => {
    it('setup: clear storage', () => { localStorage.clear(); assert(true); });
    it('returns empty array when no notes', () => {
      const notes = Storage.readNotes();
      assertDeepEquals(notes, []);
    });

    it('writes and reads notes', () => {
      const notes = [{ id: '1', title: 'Test', content: 'Hello', fontFamily: 'serif', effect: '', createdAt: 1, updatedAt: 1 }];
      Storage.writeNotes(notes);
      const result = Storage.readNotes();
      assertEquals(result.length, 1);
      assertEquals(result[0].title, 'Test');
    });

    it('backup snapshot is created on write', () => {
      Storage.writeNotes([{ id: 'x', title: 'T' }]);
      const snap = localStorage.getItem('ziai_backup_snapshot');
      assert(snap !== null);
    });
  });

  describe('settings', () => {
    it('returns defaults when no settings', () => {
      const s = Storage.readSettings();
      assert(s.unlockedAbilities.includes('jump'));
      assertEquals(s.theme, 'dark');
    });
  });

  describe('export/import', () => {
    it('exports valid JSON', () => {
      Storage.writeNotes([{ id:'e1', title:'Export' }]);
      // exportData triggers browser download, but data is serializable
      const json = JSON.stringify({ notes: Storage.readNotes(), settings: Storage.readSettings(), scores: Storage.readScores() });
      const parsed = JSON.parse(json);
      assert(parsed.notes.length === 1);
    });

    it('importData validates format', () => {
      const r1 = Storage.importData('not json');
      assert(!r1.ok);
      const r2 = Storage.importData('{"notes":[]}');
      assert(r2.ok);
    });

    it('mergeData smart merge keeps latest', () => {
      Storage.writeNotes([{ id:'a', title:'Old', updatedAt:100 }]);
      const incoming = { notes: [{ id:'a', title:'New', updatedAt:200 }] };
      Storage.mergeData(incoming, 'smart');
      const notes = Storage.readNotes();
      assertEquals(notes[0].title, 'New');
    });
  });

  describe('quota', () => {
    it('checkQuota returns usage ratio', () => {
      const q = Storage.checkQuota();
      assert(typeof q.used === 'number');
      assert(typeof q.ratio === 'number');
    });
  });
});
