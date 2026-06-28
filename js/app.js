/**
 * 字弈 — Vue 3 应用
 */
const { createApp, ref, computed, watch, onMounted, nextTick } = Vue;

const app = createApp({
  setup() {
    // ---- 初始化存储 ----
    const init = Storage.init();
    if (init.betterBackup) {
      console.warn('[App] 检测到可能的备份数据:', init.betterBackup);
    }

    // ---- 响应式状态 ----
    const notes = ref(init.notes);
    const view = ref('main'); // main | editor | game

    // Editor
    const editingId = ref(null);
    const editTitle = ref('');
    const editContent = ref('');
    const editFont = ref('system-ui');
    const editEffect = ref('');

    // Dialog
    const dialog = ref({ show: false, icon: '', title: '', msg: '', confirm: '确定', cancel: '', onConfirm: ()=>{}, onCancel: ()=>{} });

    // Toast
    const toast = ref({ show: false, icon: '', msg: '' });
    let toastTimer;

    // Game result
    const result = ref({ show: false, icon: '', title: '', msg: '', score: 0 });

    // Game touch state
    const touchJump = ref(false);
    const touchSlide = ref(false);
    const touchDash = ref(false);

    // Game canvas ref
    const gameCanvas = ref(null);
    const importInput = ref(null);
    let gameRunning = false;
    let _canvasTap = null; // tracked canvas tap handler
    let _lastGameStolen = null; // save for "再来一局"
    let _lastGameLevel = 1;
    let _lastGameCatch = CONFIG.THIEF_CATCH_SCORES[1];

    // ---- 计算属性 ----
    const noteCount = computed(() => notes.value.length);
    const unlocked = computed(() => Progression.getUnlocked(noteCount.value));
    const unlockedNames = computed(() => unlocked.value.map(u => u.icon + u.name).join(' '));
    const nextUnlock = computed(() => Progression.getNextUnlock(noteCount.value));
    const abilities = computed(() => Progression.getAbilities(noteCount.value));

    // ---- 字体/特效选项 ----
    const fontOptions = [
      { value: 'system-ui', label: '默认' },
      { value: "'Noto Serif SC', serif", label: '宋体' },
      { value: "'ZCOOL KaiSerif', cursive", label: '楷体' },
      { value: "'Noto Sans SC', sans-serif", label: '黑体' },
      { value: "'Long Cang', cursive", label: '手写体' },
      { value: "'Ma Shan Zheng', cursive", label: '草书' },
      { value: "'ZCOOL QingKe HuangYou', cursive", label: '圆体' },
      { value: "'JetBrains Mono', monospace", label: '等宽' },
      { value: "'ZCOOL KuaiLe', cursive", label: '可爱' },
      { value: "'Liu Jian Mao Cao', cursive", label: '瘦金' },
      { value: "'Press Start 2P', monospace", label: '像素' },
    ];

    const effectOptions = [
      { value: '', label: '无特效' },
      { value: 'neon', label: '🌟 霓虹灯' },
      { value: 'fire', label: '🔥 火焰字' },
      { value: 'pixel', label: '🕹️ 像素风' },
      { value: 'rainbow', label: '🌈 彩虹字' },
      { value: 'ice', label: '❄️ 冰霜字' },
      { value: 'typewriter', label: '📜 复古打字机' },
      { value: 'horror', label: '💀 恐怖字' },
      { value: 'stroke', label: '✨ 描边字' },
      { value: 'three-d', label: '🎪 3D立体' },
    ];

    function fontLabel(v) {
      const f = fontOptions.find(x => x.value === v);
      return f ? f.label : '默认';
    }

    function effectLabel(v) {
      const e = effectOptions.find(x => x.value === v);
      return e ? e.label.replace(/^[^\s]+\s/, '') : '';
    }

    // ---- 工具 ----
    function timeAgo(ts) {
      const diff = Date.now() - ts;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return '刚刚';
      if (mins < 60) return mins + '分钟前';
      const hours = Math.floor(mins / 60);
      if (hours < 24) return hours + '小时前';
      const days = Math.floor(hours / 24);
      if (days < 30) return days + '天前';
      return new Date(ts).toLocaleDateString('zh-CN');
    }

    function scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showToast(icon, msg) {
      toast.value = { show: true, icon, msg };
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.value.show = false; }, 2800);
    }

    // ---- 笔记操作 ----
    function openEditor(note) {
      if (note) {
        editingId.value = note.id;
        editTitle.value = note.title;
        editContent.value = note.content;
        editFont.value = note.fontFamily;
        editEffect.value = note.effect;
      } else {
        editingId.value = null;
        editTitle.value = '';
        editContent.value = '';
        editFont.value = 'system-ui';
        editEffect.value = '';
      }
      view.value = 'editor';
    }

    function closeEditor() {
      view.value = 'main';
      editingId.value = null;
    }

    function saveNote() {
      if (!editTitle.value.trim() && !editContent.value.trim()) {
        showToast('⚠️', '标题或内容不能为空');
        return;
      }
      const oldCount = notes.value.length;

      if (editingId.value) {
        Notes.update(editingId.value, {
          title: editTitle.value.trim() || '未命名笔记',
          content: editContent.value,
          fontFamily: editFont.value,
          effect: editEffect.value,
        });
      } else {
        Notes.create(
          editTitle.value.trim() || '未命名笔记',
          editContent.value,
          editFont.value,
          editEffect.value,
        );
      }

      notes.value = Notes.getAll();

      // Check new unlocks
      const newCount = notes.value.length;
      const unlocked = Progression.checkNewUnlocks(oldCount, newCount);
      if (unlocked.length > 0) {
        const names = unlocked.map(u => u.icon + u.name).join(' ');
        showToast('🎉', '解锁新能力: ' + names + '！');
      }

      view.value = 'main';
      editingId.value = null;

      // Auto-export on milestones
      if (newCount === 50 || newCount === 100) {
        setTimeout(() => Storage.exportData(), 500);
        showToast('📥', '已达' + newCount + '条笔记，自动导出备份！');
      }
    }

    function deleteNote() {
      if (!editingId.value) return;
      dialog.value = {
        show: true,
        icon: '🗑️',
        title: '删除笔记？',
        msg: '删除后可从备份中恢复',
        confirm: '确认删除',
        cancel: '取消',
        onConfirm: () => {
          Notes.remove(editingId.value);
          notes.value = Notes.getAll();
          view.value = 'main';
        },
        onCancel: () => {},
      };
    }

    // ---- 导出/导入 ----
    function exportData() {
      Storage.exportData();
      showToast('📥', '备份已下载');
    }

    function triggerImport() {
      importInput.value.click();
    }

    function onImportFile(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const parsed = Storage.importData(ev.target.result);
        if (!parsed.ok) {
          showToast('❌', parsed.error);
          return;
        }
        dialog.value = {
          show: true,
          icon: '📤',
          title: '导入数据',
          msg: `发现 ${parsed.data.notes.length} 条笔记，如何处理？`,
          confirm: '智能合并',
          cancel: '取消',
          onConfirm: () => {
            const r = Storage.mergeData(parsed.data, 'smart');
            notes.value = Notes.getAll();
            showToast('✅', `已合并，共 ${r.count} 条笔记`);
          },
          onCancel: () => {},
        };
      };
      reader.readAsText(file);
      e.target.value = '';
    }

    // ---- 游戏 ----
    function onGameClick() {
      if (notes.value.length === 0) {
        showToast('📝', '还没有笔记，先写一篇吧！');
        return;
      }
      // Steal ceil(notes/5) notes
      const stealCount = Math.ceil(notes.value.length / CONFIG.THIEF_NOTES_STEAL_DIVISOR);
      const allNotes = [...notes.value];
      const stolenNotes = [];
      for (let i = 0; i < stealCount; i++) {
        const idx = Math.floor(Math.random() * allNotes.length);
        stolenNotes.push(allNotes.splice(idx, 1)[0]);
      }
      const level = stolenNotes.length;
      const thiefLevels = ['', '🥷 小偷 Lv.2', '🥷 小偷 Lv.3', '🥷 小偷 Lv.4', '🥷 小偷 Lv.5+'];
      const levelName = thiefLevels[Math.min(level - 1, 4)] || '🥷 小偷 Lv.1';
      const noteNames = stolenNotes.map(n => '《' + (n.title || '未命名') + '》').join('、');
      const catchScores = CONFIG.THIEF_CATCH_SCORES;
      const catchScore = catchScores[Math.min(level, 5)];

      dialog.value = {
        show: true,
        icon: '🦹',
        title: levelName + ' 来袭！',
        msg: `偷走了 ${level} 份笔记：${noteNames}\n需要跑到 ${catchScore} 分才能追上！`,
        confirm: '追！',
        cancel: '算了',
        onConfirm: () => {
          dialog.value.show = false;
          startGame(stolenNotes, level, catchScore);
        },
        onCancel: () => {},
      };
    }

    function startGame(stolenNotes, thiefLevel, catchScore) {
      // Save for "再来一局"
      if (stolenNotes) {
        _lastGameStolen = stolenNotes;
        _lastGameLevel = thiefLevel || 1;
        _lastGameCatch = catchScore || 5000;
      }

      // Clean up previous game + tap handler
      GameCore.destroy();
      if (_canvasTap && gameCanvas.value) {
        gameCanvas.value.removeEventListener('click', _canvasTap);
        gameCanvas.value.removeEventListener('pointerdown', _canvasTap);
        _canvasTap = null;
      }

      view.value = 'game';
      gameRunning = false;
      GameInput.reset();

      nextTick(() => {
        const canvas = gameCanvas.value;
        if (!canvas) { console.error('[App] No canvas element'); return; }

        const notes = stolenNotes || _lastGameStolen || [Notes.randomPick() || { title: '空白笔记', content: '' }];
        const level = thiefLevel || _lastGameLevel || 1;
        const catchTarget = catchScore || _lastGameCatch || 5000;

        try {
        _gameNotes = notes;
        GameCore.init(canvas, {
          abilities: abilities.value,
          stolenNotes: notes,
          thiefLevel: level,
          catchScore: catchTarget,
        });

        // Tap handler: start / resume
        _canvasTap = () => {
          const s = GameCore.getState();
          if (s === 'ready') {
            gameRunning = true;
            GameCore.start();
          } else if (s === 'paused') {
            GameCore.resume();
          }
        };
        canvas.addEventListener('click', _canvasTap);
        canvas.addEventListener('pointerdown', _canvasTap);

        } catch(e) {
          console.error('[App] Game init failed:', e);
          showToast('❌', '游戏启动失败: ' + e.message);
        }
      });
    }

    function quitGame() {
      GameCore.destroy();
      if (_canvasTap && gameCanvas.value) {
        gameCanvas.value.removeEventListener('click', _canvasTap);
        gameCanvas.value.removeEventListener('pointerdown', _canvasTap);
        _canvasTap = null;
      }
      gameRunning = false;
      GameInput.reset();
      view.value = 'main';
    }

    function saveScore(score, note) {
      const scores = Storage.readScores();
      scores.push({ score, date: Date.now(), noteTitle: note?.title || '' });
      scores.sort((a, b) => b.score - a.score);
      Storage.writeScores(scores.slice(0, 10));
    }

    // Watch touch state → bridge to GameInput
    watch(touchJump, (v) => { if (v) GameInput.setTouchJump(); });
    watch(touchSlide, (v) => { GameInput.setTouchSlide(v); });
    watch(touchDash, (v) => { if (v) GameInput.setTouchDash(); });

    // ---- 定期备份提醒 ----
    function checkBackupReminder() {
      const lastExport = localStorage.getItem('ziai_last_export_reminder');
      const now = Date.now();
      if (!lastExport || now - parseInt(lastExport) > 30 * 24 * 3600000) {
        if (notes.value.length >= 5) {
          setTimeout(() => {
            showToast('💡', '已守护你的笔记，建议导出备份');
          }, 5000);
        }
        localStorage.setItem('ziai_last_export_reminder', String(now));
      }
    }

    // ---- Mount ----
    onMounted(() => {
      checkBackupReminder();

      // EventBus: game events → Vue UI
      EventBus.on('game:win', (r) => {
        gameRunning = false;
        const sn = r.stolenNotes || _gameNotes;
        saveScore(r.score, sn[0]);
        const names = sn.map(n => '《' + (n.title || '笔记') + '》').join('、');
        result.value = {
          show: true, icon: '🎉', title: '夺回笔记！',
          msg: `成功追回了 ${names}！`, score: r.score,
        };
      });

      EventBus.on('game:lose', (r) => {
        gameRunning = false;
        const sn = r.stolenNotes || _gameNotes;
        saveScore(r.score, sn[0]);
        const names = sn.map(n => '《' + (n.title || '笔记') + '》').join('、');
        result.value = {
          show: true, icon: r.reason === 'dead' ? '💀' : '😢',
          title: r.reason === 'dead' ? '你倒下了...' : '被逃走了...',
          msg: r.reason === 'dead'
            ? `小偷带着 ${names} 逃之夭夭...\n别担心，笔记还在你的收藏里！`
            : `小偷带着 ${names} 消失了。别担心，笔记还在！`,
          score: r.score,
        };
      });

      EventBus.on('game:lifeLost', (r) => {
        showToast('💔', `失去一条命！还剩 ${r.lives} 条`);
      });

      // Periodic quota check
      setInterval(() => {
        const q = Storage.checkQuota();
        if (q.ratio > 0.85) {
          console.warn('[App] Storage usage:', Math.round(q.ratio * 100) + '%');
          showToast('⚠️', '存储空间紧张，请导出备份');
        }
      }, 60000);
    });

    // ---- Expose ----
    return {
      // State
      notes, view, editingId, editTitle, editContent, editFont, editEffect,
      dialog, toast, result,
      touchJump, touchSlide, touchDash,
      gameCanvas, importInput,

      // Computed
      noteCount, unlockedNames, nextUnlock, abilities,

      // Options
      fontOptions, effectOptions, fontLabel, effectLabel, timeAgo,

      // Methods
      scrollToTop, openEditor, closeEditor, saveNote, deleteNote,
      exportData, triggerImport, onImportFile,
      onGameClick, startGame, quitGame,
    };
  },
});

app.mount('#app');
