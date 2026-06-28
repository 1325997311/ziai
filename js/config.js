/**
 * 字弈 — 全局配置
 * 所有可调参数集中管理，方便热调参与跨模块共享
 */
const CONFIG = {

  // ---- Canvas ----
  CANVAS_W: 400,
  CANVAS_H: 700,
  GROUND_Y: 560,

  // ---- 玩家物理 (兔子) ----
  PLAYER_W: 28,
  PLAYER_H: 30,
  PLAYER_X: 90,          // 屏幕 X 固定位置
  GRAVITY: 0.1,          // 基础重力 (会随速度缩放: g × m²)
  JUMP_VEL: -5.4,        // 基础跳跃初速 (会随速度缩放: v × m)
  DOUBLE_JUMP_VEL: -4.2, // 二段跳初速
  SLIDE_DURATION: 30,    // 下滑帧数
  SLIDE_H: 16,           // 下滑时高度
  DASH_DURATION: 24,     // 冲刺帧数
  DASH_COOLDOWN: 180,    // 冲刺冷却帧数
  INVINCIBLE_AFTER_HIT: 120, // 受伤后无敌帧数
  HITBOX_SHRINK: 0.35,   // 碰撞框缩小比例 (仁慈判定)

  // ---- 小偷 ----
  THIEF_W: 28,
  THIEF_H: 30,
  THIEF_SCREEN_X: 330,   // 锁定时屏幕位置
  THIEF_SPEED_NORMAL: 0.94,   // 正常逃跑速度倍率
  THIEF_SPEED_PANIC: 1.08,    // 慌张加速倍率
  THIEF_SPEED_TAUNT: 0.80,    // 嘲讽减速倍率

  // 小偷等级
  THIEF_CATCH_SCORES: [0, 25000, 40000, 60000, 90000, 125000],
  THIEF_LEVEL_NAMES: ['', '🥷 小偷 Lv.2', '🥷 小偷 Lv.3', '🥷 小偷 Lv.4', '🥷 小偷 Lv.5+'],
  THIEF_NOTES_STEAL_DIVISOR: 5, // 偷 ceil(n/5) 份笔记

  // 小偷技能冷却
  ROCK_COOLDOWN_BASE: 180,   // 投石基础冷却帧数
  ROCK_COOLDOWN_RAND: 120,   // 投石随机额外冷却
  ROCK_COOLDOWN_LV4_MULT: 0.7,
  ROCK_COOLDOWN_LV5_MULT: 0.6,
  THROW_ANIM_FRAMES: 35,     // 投石动画帧数
  ROCK_MIN_GAP: 120,          // 石头与障碍物最小间距

  // ---- 障碍物 ----
  OBSTACLE_MIN_GAP: 130,     // 障碍物最小间距
  OBSTACLE_SPAWN_X: 500,     // 生成点 X
  OBSTACLE_SPAWN_BASE: 80,   // 基础生成间隔
  OBSTACLE_SPAWN_RAND: 120,  // 随机生成间隔
  OBSTACLE_DENSITY_MAX: 50000, // 密度达到上限的分数

  // ---- 速度系统 ----
  BASE_SPEED: 2.5,
  SPEED_TIERS: [2.5, 3.5, 5, 6.5, 8, 10, 12],
  SPEED_TIER_SCORES: [0, 30000, 70000, 120000, 180000, 260000, 360000],
  SPEED_WARNING_FRAMES: 120,  // 加速前警告 2s
  SPEED_BUFFER_FRAMES: 180,   // 加速后缓冲 3s
  SPEED_WARNING_AHEAD: 200,   // 提前多少分警告

  // ---- 得分 ----
  SCORE_PER_FRAME: 10,       // 存活得分/帧
  SCORE_WIN_BONUS: 500,      // 胜利奖励

  // ---- 游戏流程 ----
  THIEF_START_X: 600,        // 小偷初始世界坐标

  // ---- 储存 ----
  STORAGE_PREFIX: 'ziai_',
  BACKUP_HOURLY_MAX: 24,
  BACKUP_DAILY_MAX: 30,
  BACKUP_WEEKLY_MAX: 12,
  EXPORT_REMINDER_DAYS: 30,
};
