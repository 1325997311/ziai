/**
 * 多层存储系统 — 防笔记丢失
 *
 * 第 0 层: 写入安全 (sessionStorage 临时副本 + 校验)
 * 第 1 层: 自动备份 (快照 + 小时/日/周)
 * 第 2 层: 导出 JSON 文件
 * 第 3 层: 导入恢复 + 智能合并
 * 第 4 层: 启动健康检查 + 逐级恢复
 */

const Storage = (() => {
  const KEYS = {
    notes: 'ziai_notes',
    settings: 'ziai_settings',
    scores: 'ziai_scores',
    snapshot: 'ziai_backup_snapshot',
    lastBackup: 'ziai_last_backup_date',
  };

  // ---- 工具函数 ----

  function checksum(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + c;
      hash |= 0;
    }
    return hash.toString(36);
  }

  function now() { return Date.now(); }

  function backupKey(prefix, ts) {
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, '0');
    if (prefix === 'hourly') {
      return `ziai_backup_hourly_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}`;
    }
    if (prefix === 'daily') {
      return `ziai_backup_daily_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
    }
    if (prefix === 'weekly') {
      const start = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
      return `ziai_backup_weekly_${d.getFullYear()}W${pad(week)}`;
    }
    return `ziai_backup_${prefix}`;
  }

  // ---- 读 ----

  function readNotes() {
    try {
      const raw = localStorage.getItem(KEYS.notes);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error('[Storage] 笔记数据损坏，尝试恢复...');
      return recoverNotes();
    }
  }

  function readSettings() {
    try {
      const raw = localStorage.getItem(KEYS.settings);
      if (!raw) return defaultSettings();
      return JSON.parse(raw);
    } catch (e) {
      return defaultSettings();
    }
  }

  function readScores() {
    try {
      const raw = localStorage.getItem(KEYS.scores);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  function defaultSettings() {
    return {
      unlockedAbilities: ['jump'],
      tutorialsSeen: {},
      theme: 'dark',
      soundEnabled: true,
    };
  }

  // ---- 写（第 0 层：写入安全） ----

  function writeNotes(notes) {
    const json = JSON.stringify(notes);
    // Step 1: 写 sessionStorage 临时副本
    try { sessionStorage.setItem(KEYS.notes + '_tmp', json); } catch(e) {}
    // Step 2: 写 localStorage
    localStorage.setItem(KEYS.notes, json);
    // Step 3: 校验
    const written = localStorage.getItem(KEYS.notes);
    if (written !== json) {
      console.error('[Storage] 写入校验失败，回滚...');
      // 回滚：从 sessionStorage 恢复
      const backup = sessionStorage.getItem(KEYS.notes + '_tmp');
      if (backup) localStorage.setItem(KEYS.notes, backup);
      return false;
    }
    // Step 4: 清除临时副本
    sessionStorage.removeItem(KEYS.notes + '_tmp');
    // Step 5: 触发备份
    scheduleBackup(notes);
    return true;
  }

  function writeSettings(settings) {
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  }

  function writeScores(scores) {
    localStorage.setItem(KEYS.scores, JSON.stringify(scores));
  }

  // ---- 第 1 层：自动备份 ----

  function scheduleBackup(notes) {
    if (!notes || notes.length === 0) return;
    const ts = now();

    // 快照：每次保存都更新
    const snap = { version: 1, timestamp: ts, noteCount: notes.length, checksum: checksum(JSON.stringify(notes)), data: notes };
    try { localStorage.setItem(KEYS.snapshot, JSON.stringify(snap)); } catch(e) {}

    // 小时备份
    const lastBackup = localStorage.getItem(KEYS.lastBackup) || '';
    const hourKey = backupKey('hourly', ts);
    const lastHour = backupKey('hourly', ts - 3600000);
    if (hourKey !== lastBackup) {
      try { localStorage.setItem(hourKey, JSON.stringify(snap)); } catch(e) {}
      // 清理超过 24 份的小时备份
      pruneBackups('hourly', 24);
    }

    // 日备份
    const dayKey = backupKey('daily', ts);
    if (dayKey !== lastBackup.substring(0, dayKey.length)) {
      try { localStorage.setItem(dayKey, JSON.stringify(snap)); } catch(e) {}
      pruneBackups('daily', 30);
    }

    // 周备份 (周一)
    if (new Date(ts).getDay() === 1) {
      const weekKey = backupKey('weekly', ts);
      try { localStorage.setItem(weekKey, JSON.stringify(snap)); } catch(e) {}
      pruneBackups('weekly', 12);
    }

    localStorage.setItem(KEYS.lastBackup, hourKey);
  }

  function pruneBackups(prefix, max) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`ziai_backup_${prefix}_`)) keys.push(k);
    }
    keys.sort();
    while (keys.length > max) {
      localStorage.removeItem(keys.shift());
    }
  }

  // ---- 第 4 层：健康检查 + 逐级恢复 ----

  function recoverNotes() {
    // 尝试 1: 快照
    try {
      const snap = JSON.parse(localStorage.getItem(KEYS.snapshot));
      if (snap && snap.data && Array.isArray(snap.data)) {
        console.log('[Storage] 从快照恢复笔记数据');
        return snap.data;
      }
    } catch(e) {}

    // 尝试 2: 最新小时备份
    const backups = findBackups('hourly');
    for (let i = backups.length - 1; i >= 0; i--) {
      try {
        const b = JSON.parse(localStorage.getItem(backups[i]));
        if (b && b.data && Array.isArray(b.data)) {
          console.log('[Storage] 从小时备份恢复:', backups[i]);
          return b.data;
        }
      } catch(e) {}
    }

    // 尝试 3: 日备份
    const dailys = findBackups('daily');
    for (let i = dailys.length - 1; i >= 0; i--) {
      try {
        const b = JSON.parse(localStorage.getItem(dailys[i]));
        if (b && b.data && Array.isArray(b.data)) {
          console.log('[Storage] 从日备份恢复:', dailys[i]);
          return b.data;
        }
      } catch(e) {}
    }

    // 尝试 4: 周备份
    const weeklies = findBackups('weekly');
    for (let i = weeklies.length - 1; i >= 0; i--) {
      try {
        const b = JSON.parse(localStorage.getItem(weeklies[i]));
        if (b && b.data && Array.isArray(b.data)) {
          console.log('[Storage] 从周备份恢复:', weeklies[i]);
          return b.data;
        }
      } catch(e) {}
    }

    console.error('[Storage] 所有恢复尝试失败，返回空数据');
    return [];
  }

  function findBackups(prefix) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`ziai_backup_${prefix}_`)) keys.push(k);
    }
    return keys.sort();
  }

  // ---- 检查是否有更新的备份 ----
  function checkForBetterBackup(currentCount) {
    const backups = findBackups('daily');
    for (let i = backups.length - 1; i >= 0; i--) {
      try {
        const b = JSON.parse(localStorage.getItem(backups[i]));
        if (b && b.noteCount > currentCount) {
          return { key: backups[i], count: b.noteCount, timestamp: b.timestamp };
        }
      } catch(e) {}
    }
    // 也检查 snapshot
    try {
      const snap = JSON.parse(localStorage.getItem(KEYS.snapshot));
      if (snap && snap.noteCount > currentCount) {
        return { key: 'snapshot', count: snap.noteCount, timestamp: snap.timestamp };
      }
    } catch(e) {}
    return null;
  }

  // ---- 第 2 层：导出 ----

  async function exportData() {
    const data = {
      version: 1,
      exportedAt: now(),
      notes: readNotes(),
      settings: readSettings(),
      scores: readScores(),
    };
    const json = JSON.stringify(data, null, 2);

    // Try File System Access API (lets user pick/overwrite file)
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'ziai-backup.json',
          types: [{ description: 'JSON Backup', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        return true;
      } catch (e) {
        if (e.name === 'AbortError') return false; // user cancelled
      }
    }

    // Fallback: traditional download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = 'ziai-backup.json';
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  // ---- 第 3 层：导入 ----

  function importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || !Array.isArray(data.notes)) {
        return { ok: false, error: '无效的备份文件格式' };
      }
      return { ok: true, data };
    } catch(e) {
      return { ok: false, error: '文件解析失败: ' + e.message };
    }
  }

  function mergeData(incoming, strategy) {
    const current = readNotes();
    let merged;

    switch (strategy) {
      case 'overwrite':
        merged = incoming.notes;
        break;
      case 'missing':
        merged = [...current];
        const existingIds = new Set(current.map(n => n.id));
        for (const n of incoming.notes) {
          if (!existingIds.has(n.id)) merged.push(n);
        }
        break;
      case 'smart':
      default:
        merged = [...current];
        const idx = {};
        merged.forEach((n, i) => { idx[n.id] = i; });
        for (const n of incoming.notes) {
          if (n.id in idx) {
            // 保留更新时间较新的版本
            if (n.updatedAt > merged[idx[n.id]].updatedAt) {
              merged[idx[n.id]] = n;
            }
          } else {
            merged.push(n);
          }
        }
        break;
    }

    // 恢复前自动快照
    const preSnap = {
      version: 1,
      timestamp: now(),
      noteCount: current.length,
      checksum: checksum(JSON.stringify(current)),
      data: current,
      label: '导入前自动快照',
    };
    try { localStorage.setItem('ziai_backup_pre_import', JSON.stringify(preSnap)); } catch(e) {}

    writeNotes(merged);
    if (incoming.settings) writeSettings(incoming.settings);
    if (incoming.scores) writeScores(incoming.scores);

    return { ok: true, count: merged.length };
  }

  // ---- 存储用量 ----

  function checkQuota() {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('ziai_')) {
        used += (localStorage.getItem(k) || '').length;
      }
    }
    // 保守估计 5MB 限制
    return { used, limit: 5 * 1024 * 1024, ratio: used / (5 * 1024 * 1024) };
  }

  // ---- 初始化 ----

  function init() {
    const notes = readNotes();
    // 健康检查
    const better = checkForBetterBackup(notes.length);
    return { notes, settings: readSettings(), scores: readScores(), betterBackup: better };
  }

  return {
    readNotes,
    readSettings,
    readScores,
    writeNotes,
    writeSettings,
    writeScores,
    exportData,
    importData,
    mergeData,
    checkQuota,
    checkForBetterBackup,
    recoverNotes,
    init,
    KEYS,
  };
})();
