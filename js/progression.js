/**
 * 进阶系统 — 笔记数 → 游戏能力解锁
 */

const Progression = (() => {
  const THRESHOLDS = [
    { count: 0,  ability: 'jump',        name: '跳跃',     icon: '⬆', desc: '基础跳跃能力' },
    { count: 10, ability: 'slide',       name: '下滑',     icon: '⬇', desc: '按下键滑行通过低矮障碍' },
    { count: 30, ability: 'doubleJump',  name: '二段跳',   icon: '🦘', desc: '空中再次跳跃' },
    { count: 50, ability: 'dash',        name: '冲刺',     icon: '💨', desc: 'Shift 冲刺，无敌状态' },
    { count: 100,ability: 'extraLife',   name: '额外生命', icon: '❤️', desc: '开局携带两条命' },
  ];

  function getUnlocked(noteCount) {
    return THRESHOLDS.filter(t => noteCount >= t.count);
  }

  function getNextUnlock(noteCount) {
    return THRESHOLDS.find(t => noteCount < t.count) || null;
  }

  function checkNewUnlocks(oldCount, newCount) {
    const newly = [];
    for (const t of THRESHOLDS) {
      if (t.count > 0 && oldCount < t.count && newCount >= t.count) {
        newly.push(t);
      }
    }
    return newly;
  }

  function isAbilityUnlocked(ability, noteCount) {
    const t = THRESHOLDS.find(x => x.ability === ability);
    return t ? noteCount >= t.count : false;
  }

  function getAbilities(noteCount) {
    return getUnlocked(noteCount).map(t => t.ability);
  }

  return {
    THRESHOLDS,
    getUnlocked,
    getNextUnlock,
    checkNewUnlocks,
    isAbilityUnlocked,
    getAbilities,
  };
})();
