// Source loaded globally by runner

describe('Player', () => {
  function makePlayer(abilities = ['jump']) {
    return new Player.PlayerState(abilities);
  }

  describe('constructor', () => {
    it('initial state is running', () => {
      const p = makePlayer();
      assertEquals(p.state, 'running');
      assert(p.onGround);
    });

    it('starts at correct position', () => {
      const p = makePlayer();
      assertEquals(p.x, 90);
      assertEquals(p.y, 560 - 30);
    });

    it('abilities are parsed correctly', () => {
      const p = makePlayer(['jump', 'slide', 'dash']);
      assert(p.canGlide);
      assert(p.canDash);
      assert(!p.canDoubleJump);
    });
  });

  describe('jump', () => {
    it('jumps from ground', () => {
      const p = makePlayer();
      p.jump();
      assertEquals(p.state, 'jumping');
      assert(p.vy < 0);
      assert(!p.onGround);
    });

    it('cannot jump while dashing', () => {
      const p = makePlayer(['dash']);
      p.dash();
      const st = p.state;
      p.jump();
      assertEquals(p.state, st); // no change while dashing
    });

    it('double jump only if unlocked', () => {
      const p = makePlayer(['doubleJump']);
      p.onGround = false;
      p.state = 'jumping';
      p.jump();
      assert(p.hasDoubleJumped);
      assert(p.vy < 0);
    });

    it('cannot double jump without unlock', () => {
      const p = makePlayer();
      p.onGround = false;
      p.state = 'jumping';
      const vy = p.vy;
      p.jump();
      assertEquals(p.vy, vy); // no change
    });
  });

  describe('physics', () => {
    it('gravity pulls player down', () => {
      const p = makePlayer();
      p.jump();
      const vy0 = p.vy;
      p.update(1);
      assert(p.vy > vy0, 'velocity should increase (downward)');
    });

    it('lands on ground', () => {
      const p = makePlayer();
      p.y = 560 - 30 + 1; // below ground
      p.onGround = false;
      p.update(1);
      assert(p.onGround);
      assertEquals(p.state, 'running');
    });

    it('speed mult scales gravity quadratically', () => {
      const p = makePlayer();
      p.y = 500; p.onGround = false; p.vy = 0;
      p.update(2); // m=2 → g*4
      const vy1 = p.vy;
      const p2 = makePlayer();
      p2.y = 500; p2.onGround = false; p2.vy = 0;
      p2.update(1); // m=1 → g*1
      // vy after 1 frame with m=2 should be ~4x vy with m=1
      assert(vy1 > p2.vy * 3);
    });
  });

  describe('glide', () => {
    it('glides when unlocked and in air falling', () => {
      const p = makePlayer(['slide']);
      p.onGround = false;
      p.vy = 5; // falling
      p.glide();
      assertEquals(p.state, 'gliding');
      assert(p.isGliding);
    });

    it('cannot glide on ground', () => {
      const p = makePlayer(['slide']);
      p.onGround = true;
      p.glide();
      assert(!p.isGliding);
    });

    it('stopGlide clears gliding state', () => {
      const p = makePlayer(['slide']);
      p.onGround = false;
      p.vy = 5;
      p.glide();
      p.stopGlide();
      assert(!p.isGliding);
    });
  });

  describe('dash', () => {
    it('dash activates invincibility', () => {
      const p = makePlayer(['dash']);
      p.dash();
      assertEquals(p.state, 'dashing');
      assert(p.invincible);
      assert(p.dashTimer > 0);
    });

    it('dash has cooldown', () => {
      const p = makePlayer(['dash']);
      p.dash();
      const cd = p.dashCooldown;
      p.dash(); // second dash should fail
      assertEquals(p.dashCooldown, cd); // unchanged
    });
  });

  describe('hitbox', () => {
    it('getHitbox is smaller than visual', () => {
      const p = makePlayer();
      const hb = p.getHitbox();
      assert(hb.w < p.w);
      assert(hb.h < p.h);
    });
  });

  describe('die', () => {
    it('die returns true normally', () => {
      const p = makePlayer();
      assert(p.die());
      assertEquals(p.state, 'dead');
    });

    it('die returns false when invincible', () => {
      const p = makePlayer();
      p.invincible = true;
      assert(!p.die());
    });
  });
});
