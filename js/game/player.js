/**
 * 玩家角色 — 兔子物理 + 能力
 * 物理参数从 CONFIG 读取，随 game speed 动态缩放
 */
const Player = (() => {
  const {
    PLAYER_W: W, PLAYER_H: H, PLAYER_X: BASE_X, GROUND_Y,
    GRAVITY, JUMP_VEL, DOUBLE_JUMP_VEL,
    SLIDE_DURATION, SLIDE_H, DASH_DURATION, DASH_COOLDOWN,
    HITBOX_SHRINK,
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
      this.canSlide       = abilities.includes('slide');
      this.canDoubleJump  = abilities.includes('doubleJump');
      this.canDash        = abilities.includes('dash');
      this.extraLife      = abilities.includes('extraLife');
      this.hasDoubleJumped = false;
      this.slideTimer     = 0;
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
      if (this.slideTimer > 0) {
        this.slideTimer--;
        if (this.slideTimer === 0 && this.onGround) {
          this.state = 'running';
          this.y = GROUND_Y - this.h;
          this.h = H;
        }
      }

      // 重力
      if (this.state !== 'sliding' || !this.onGround) {
        this.vy += g;
        this.y += this.vy;
      }

      // 着地检测
      if (this.y >= GROUND_Y - this.h) {
        this.y = GROUND_Y - this.h;
        this.vy = 0;
        this.onGround = true;
        this.hasDoubleJumped = false;
        if (this.state === 'jumping') this.state = 'running';
        if (this.state === 'sliding' && this.slideTimer <= 0) {
          this.state = 'running';
          this.h = H;
        }
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
      if (this.dashTimer > 0 || this.state === 'sliding') return;
      const m = this.speedMult;
      if (this.onGround) {
        this.vy = JUMP_VEL * m;
        this.state = 'jumping';
        this.onGround = false;
        this.hasDoubleJumped = false;
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        this.vy = DOUBLE_JUMP_VEL * m;
        this.hasDoubleJumped = true;
      }
    }

    slide() {
      if (!this.canSlide || this.dashTimer > 0 || !this.onGround) return;
      this.state = 'sliding';
      this.slideTimer = SLIDE_DURATION;
      this.h = SLIDE_H;
      this.y = GROUND_Y - SLIDE_H;
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
      this.slideTimer = 0;
      this.dashTimer = 0;
      this.dashCooldown = 0;
      this.invincible = false;
      this.invincibleTimer = 0;
      this.trail = [];
      if (abilities) {
        this.canSlide       = abilities.includes('slide');
        this.canDoubleJump  = abilities.includes('doubleJump');
        this.canDash        = abilities.includes('dash');
        this.extraLife      = abilities.includes('extraLife');
      }
    }
  }

  return { PlayerState };
})();
