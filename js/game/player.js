/**
 * 玩家角色 — 兔子物理 + 能力
 * 物理参数从 CONFIG 读取，随 game speed 动态缩放
 */
const Player = (() => {
  const {
    PLAYER_W: W, PLAYER_H: H, PLAYER_X: BASE_X, GROUND_Y,
    GRAVITY, JUMP_VEL, DOUBLE_JUMP_VEL,
    DASH_DURATION, DASH_COOLDOWN, HITBOX_SHRINK,
  } = CONFIG;

  class PlayerState {
    constructor(abilities) {
      this.x = BASE_X;
      this.y = GROUND_Y - H;
      this.w = W;
      this.h = H;
      this.vy = 0;
      this.state = 'running';
      this.frame = 0;
      this.onGround = true;
      this.canGlide       = abilities.includes('slide'); // renamed: slide→glide
      this.canDoubleJump  = abilities.includes('doubleJump');
      this.canDash        = abilities.includes('dash');
      this.extraLife      = abilities.includes('extraLife');
      this.hasDoubleJumped = false;
      this.isGliding      = false;
      this.dashTimer      = 0;
      this.dashCooldown   = 0;
      this.invincible     = false;
      this.invincibleTimer = 0;
      this.trail          = [];
      this.speedMult      = 1;
    }

    /** 碰撞盒 (仁慈判定: 缩小 HITBOX_SHRINK) */
    getHitbox() {
      const sx = this.w * HITBOX_SHRINK;
      const sy = this.h * HITBOX_SHRINK;
      return { x: this.x + sx, y: this.y + sy, w: this.w - sx * 2, h: this.h - sy * 2 };
    }

    /**
     * 每帧更新
     * @param {number} speedMult - 速度倍率 (当前速度 / 基础速度)
     *   重力按 m² 缩放，跳跃初速按 m 缩放 → 高度恒定，滞空时间 ∝ 1/m
     */
    update(speedMult = 1) {
      this.speedMult = speedMult;
      const g = GRAVITY * speedMult * speedMult;
      this.frame += 0.15;

      // 计时器
      if (this.dashTimer > 0) {
        this.dashTimer--;
        if (this.dashTimer === 0) {
          this.state = this.onGround ? 'running' : 'jumping';
          this.invincible = false;
        }
      }
      if (this.dashCooldown > 0) this.dashCooldown--;
      if (this.invincibleTimer > 0) {
        this.invincibleTimer--;
        if (this.invincibleTimer === 0 && this.dashTimer === 0) this.invincible = false;
      }
      // Glide: reduced gravity when in air and holding jump
      const glideGravity = (this.isGliding && !this.onGround) ? g * 0.12 : g;

      // 重力
      this.vy += glideGravity;
      this.y += this.vy;

      // 着地检测
      if (this.y >= GROUND_Y - this.h) {
        this.y = GROUND_Y - this.h;
        this.vy = 0;
        this.onGround = true;
        this.hasDoubleJumped = false;
        this.isGliding = false;
        if (this.state === 'jumping') this.state = 'running';
      } else {
        this.onGround = false;
      }

      // 冲刺残影
      if (this.dashTimer > 0) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();
      } else {
        if (this.trail.length > 0) this.trail.shift();
      }
    }

    jump() {
      if (this.dashTimer > 0) return;
      const m = this.speedMult;
      if (this.onGround) {
        this.vy = JUMP_VEL * m;
        this.state = 'jumping';
        this.onGround = false;
        this.hasDoubleJumped = false;
        this.isGliding = false;
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        this.vy = DOUBLE_JUMP_VEL * m;
        this.hasDoubleJumped = true;
        this.isGliding = false;
      }
    }

    /** Start gliding (slow descent) — called every frame while jump held in air */
    glide() {
      if (!this.canGlide || this.dashTimer > 0 || this.onGround) return;
      if (this.vy > 0) { // only glide when falling
        this.isGliding = true;
        this.state = 'gliding';
      }
    }

    /** Stop gliding when jump released */
    stopGlide() {
      this.isGliding = false;
      if (this.state === 'gliding') this.state = 'jumping';
    }

    dash() {
      if (!this.canDash || this.dashCooldown > 0 || this.dashTimer > 0) return;
      this.state = 'dashing';
      this.dashTimer = DASH_DURATION;
      this.dashCooldown = DASH_COOLDOWN;
      this.invincible = true;
      this.trail = [];
    }

    /** @returns {boolean} 是否真的死了 (无敌时不死) */
    die() {
      if (this.invincible) return false;
      this.state = 'dead';
      return true;
    }

    reset(abilities) {
      this.x = BASE_X;
      this.y = GROUND_Y - H;
      this.w = W;
      this.h = H;
      this.vy = 0;
      this.state = 'running';
      this.frame = 0;
      this.onGround = true;
      this.hasDoubleJumped = false;
      this.isGliding = false;
      this.dashTimer = 0;
      this.dashCooldown = 0;
      this.invincible = false;
      this.invincibleTimer = 0;
      this.trail = [];
      if (abilities) {
        this.canGlide       = abilities.includes('slide');
        this.canDoubleJump  = abilities.includes('doubleJump');
        this.canDash        = abilities.includes('dash');
        this.extraLife      = abilities.includes('extraLife');
      }
    }
  }

  return { PlayerState };
})();
