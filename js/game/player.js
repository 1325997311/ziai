/**
 * 玩家角色 — 竖屏
 */
const Player = (() => {
  const W=28, H=30;
  const GROUND_Y=560;
  const BASE_X=90;
  const GRAVITY = 0.1;
  const JUMP_VEL = -5.4;
  const DOUBLE_JUMP_VEL = -4.2;

  class PlayerState {
    constructor(abilities) {
      this.x=BASE_X; this.y=GROUND_Y-H; this.w=W; this.h=H;
      this.vy=0; this.state='running'; this.frame=0; this.onGround=true;
      this.canSlide=abilities.includes('slide');
      this.canDoubleJump=abilities.includes('doubleJump');
      this.canDash=abilities.includes('dash');
      this.extraLife=abilities.includes('extraLife');
      this.hasDoubleJumped=false;
      this.slideTimer=0; this.dashTimer=0; this.dashCooldown=0;
      this.invincible=false; this.invincibleTimer=0; this.trail=[];
      this.hitboxShrink=0.35;
      this.speedMult=1;
    }

    getHitbox() {
      const sx=this.w*this.hitboxShrink, sy=this.h*this.hitboxShrink;
      return {x:this.x+sx, y:this.y+sy, w:this.w-sx*2, h:this.h-sy*2};
    }

    update(speedMult) {
      const mult = speedMult || 1;
      this.speedMult = mult;
      const g = GRAVITY * mult * mult; // g∝m² to keep height constant
      this.frame+=0.15;
      if(this.dashTimer>0){this.dashTimer--; if(this.dashTimer===0){this.state=this.onGround?'running':'jumping'; this.invincible=false;}}
      if(this.dashCooldown>0)this.dashCooldown--;
      if(this.invincibleTimer>0){this.invincibleTimer--; if(this.invincibleTimer===0&&this.dashTimer===0)this.invincible=false;}
      if(this.slideTimer>0){this.slideTimer--; if(this.slideTimer===0&&this.onGround){this.state='running'; this.y=GROUND_Y-this.h; this.h=H;}}
      if(this.state!=='sliding'||!this.onGround){this.vy+=g; this.y+=this.vy;}
      if(this.y>=GROUND_Y-this.h){this.y=GROUND_Y-this.h; this.vy=0; this.onGround=true; this.hasDoubleJumped=false; if(this.state==='jumping')this.state='running'; if(this.state==='sliding'&&this.slideTimer<=0){this.state='running'; this.h=H;}}
      else{this.onGround=false;}
      if(this.dashTimer>0){this.trail.push({x:this.x,y:this.y}); if(this.trail.length>5)this.trail.shift();}
      else{if(this.trail.length>0)this.trail.shift();}
    }

    jump() {
      if(this.dashTimer>0||this.state==='sliding')return;
      const m = this.speedMult || 1;
      if(this.onGround){this.vy=JUMP_VEL * m; this.state='jumping'; this.onGround=false; this.hasDoubleJumped=false;}
      else if(this.canDoubleJump&&!this.hasDoubleJumped){this.vy=DOUBLE_JUMP_VEL * m; this.hasDoubleJumped=true;}
    }

    slide() {
      if(!this.canSlide||this.dashTimer>0||!this.onGround)return;
      this.state='sliding'; this.slideTimer=30; this.h=16; this.y=GROUND_Y-16;
    }

    dash() {
      if(!this.canDash||this.dashCooldown>0||this.dashTimer>0)return;
      this.state='dashing'; this.dashTimer=24; this.dashCooldown=180; this.invincible=true; this.trail=[];
    }

    die() { if(this.invincible)return false; this.state='dead'; return true; }

    reset(abilities) {
      this.x=BASE_X; this.y=GROUND_Y-H; this.w=W; this.h=H;
      this.vy=0; this.state='running'; this.frame=0; this.onGround=true;
      this.hasDoubleJumped=false; this.slideTimer=0; this.dashTimer=0; this.dashCooldown=0;
      this.invincible=false; this.invincibleTimer=0; this.trail=[];
      if(abilities){this.canSlide=abilities.includes('slide'); this.canDoubleJump=abilities.includes('doubleJump'); this.canDash=abilities.includes('dash'); this.extraLife=abilities.includes('extraLife');}
    }
  }

  return { PlayerState };
})();
