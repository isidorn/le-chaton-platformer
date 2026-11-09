// juice.js — pixel particles + screen shake for a 240x320 canvas game.
// Pure vanilla JS. World coords: y grows downward, world scrolls via camY.
(function () {
  'use strict';

  var particles = [];
  var shake = 0;

  var JUICE = {
    particles: particles,
    shake: shake,

    reset: function () {
      particles.length = 0;
      JUICE.particles = particles;
      JUICE.shake = 0;
      shake = 0;
    },

    burst: function (x, y, color, n, opts) {
      opts = opts || {};
      var spread = typeof opts.spread === 'number' ? opts.spread : Math.PI * 2;
      var speed = typeof opts.speed === 'number' ? opts.speed : 1.6;
      var life = typeof opts.life === 'number' ? opts.life : 30;
      var size = typeof opts.size === 'number' ? opts.size : 2;
      var grav = typeof opts.grav === 'number' ? opts.grav : 0.08;
      var count = n | 0;
      if (!(count > 0)) count = 1;
      count = Math.min(count, 256);

      for (var i = 0; i < count; i++) {
        var ang;
        if (spread >= Math.PI * 2) {
          ang = Math.random() * Math.PI * 2;
        } else {
          ang = -Math.PI / 2 + (Math.random() - 0.5) * spread;
        }
        var sp = speed * (0.4 + Math.random() * 0.8);
        var s = size > 1 ? 1 + ((Math.random() * size) | 0) : size;
        particles.push({
          type: 'px',
          x: x + (Math.random() - 0.5) * 2,
          y: y + (Math.random() - 0.5) * 2,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          grav: grav,
          size: Math.max(1, Math.min(3, s)),
          life: life * (0.6 + Math.random() * 0.6),
          maxLife: life,
          color: color || '#fff'
        });
      }
    },

    ring: function (x, y, color) {
      particles.push({
        type: 'ring',
        x: x,
        y: y,
        size: 2,
        life: 20,
        maxLife: 20,
        grav: 0,
        vx: 0,
        vy: 0,
        color: color || '#fff'
      });
    },

    kick: function (amount) {
      if (typeof amount === 'number' && isFinite(amount)) {
        shake = Math.min(shake + amount, 12);
      }
    },

    update: function (dt) {
      if (!isFinite(dt) || dt < 0) dt = 0;
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.vy += (p.grav || 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      shake *= Math.pow(0.88, dt);
      if (shake < 0.05) shake = 0;
      JUICE.shake = shake;
    },

    offset: function () {
      if (shake <= 0) return { x: 0, y: 0 };
      return {
        x: (Math.random() * 2 - 1) * shake,
        y: (Math.random() * 2 - 1) * shake
      };
    },

    render: function (ctx, camY) {
      try {
        camY = typeof camY === 'number' && isFinite(camY) ? camY : 0;
        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];
          var t = p.maxLife > 0 ? Math.max(p.life, 0) / p.maxLife : 0;
          ctx.fillStyle = p.color;
          if (p.type === 'ring') {
            var grow = (1 - t) * 14 + 4;
            ctx.strokeStyle = p.color;
            ctx.strokeRect(
              p.x - grow / 2,
              p.y - grow / 2 - camY,
              grow,
              grow
            );
          } else {
            ctx.fillRect(p.x, p.y - camY, p.size, p.size);
          }
        }
      } catch (e) {
        /* never throw from juice */
      }
    }
  };

  JUICE.particles = particles;
  JUICE.shake = shake;

  Object.defineProperty(JUICE, 'shake', {
    get: function () { return shake; },
    set: function (v) { if (typeof v === 'number' && isFinite(v)) shake = v; },
    configurable: true
  });
  Object.defineProperty(JUICE, 'particles', {
    get: function () { return particles; },
    set: function (v) { if (Array.isArray(v)) particles = v; },
    configurable: true
  });

  window.JUICE = JUICE;
})();
