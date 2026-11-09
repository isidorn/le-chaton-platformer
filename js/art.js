// js/art.js — Mistral brand palette, pixel-art sprites and a canvas draw helper.
// Pure vanilla JavaScript: no imports, no external assets, no network.

(function () {
  'use strict';

  window.PALETTE = {
    ink: '#241005',
    deep: '#3A1C00',
    bg0: '#160A02',
    bg1: '#3A1C00',
    yellow: '#FFD800',
    amber: '#FFAF00',
    orange: '#FF8205',
    darkOrange: '#FA500F',
    red: '#E10500',
    cream: '#FFEDCB',
    white: '#FFF6E8',
    pink: '#FF8FA3'
  };

  // Every sprite: { pal: {char: PALETTE key}, rows: [equal-length strings] }
  // '.' means transparent.

  window.SPRITES = {
    // 16x14 extra-fat orange cat, front-facing.
    // O outline, B body, D stripes, C belly/feet, E inner ears,
    // W eye whites, K pupils, N nose, M mouth, P blush cheeks
    cat: {
      pal: {
        O: 'ink',        // outline
        B: 'orange',     // body
        D: 'darkOrange', // stripes
        C: 'cream',      // belly + feet
        E: 'pink',       // inner ears
        W: 'white',      // eye whites / teeth
        K: 'ink',        // pupils
        N: 'pink',       // nose
        M: 'ink',        // mouth
        P: 'pink'        // blush cheeks
      },
      rows: [
        '................',
        '..OO........OO..',
        '.OEOO......OEOO.',
        '.OOBBBBBBBBBBOO.',
        'OBBDBBBBBBBBDBBO',
        'OBWKWBBBBBBWKWBO',
        'OBBKBBBBBBBBKBBO',
        'OBPPBBBNNNBBBPPO',
        '.OBBBBBMMMBBBBO.',
        '.OBCCCCCCCCCCBO.',
        'OBCCCCCCCCCCCCBO',
        'OBBCCCCCCCCCCBBO',
        '..OBBOCCCCOBBO..',
        '...OOOOOOOOOO...'
      ]
    },

    // 16x14 same fat cat, jump pose: happy closed eyes (^ ^),
    // open smiling mouth, legs tucked up
    catJump: {
      pal: {
        O: 'ink',
        B: 'orange',
        D: 'darkOrange',
        C: 'cream',
        E: 'pink',
        W: 'white',
        K: 'ink',
        N: 'pink',
        M: 'ink',
        P: 'pink'
      },
      rows: [
        '................',
        '..OO........OO..',
        '.OEOO......OEOO.',
        '.OOBBBBBBBBBBOO.',
        'OBBDBBBBBBBBDBBO',
        'OBK.KBBBBBBK.KBO',
        'OBBBBBBBBBBBBBBO',
        'OBPPBBBNNNBBBPPO',
        '.OBBBMMWWMMBBBO.',
        '.OBCCCCCCCCCCBO.',
        'OBCCCCCCCCCCCCBO',
        'OBBCCCCCCCCCCBBO',
        '..OBCCCCCCCCBO..',
        '....OOOOOOOO....'
      ]
    },

    // 7x7 yellow star collectible
    star: {
      pal: {
        O: 'ink',
        Y: 'yellow'
      },
      rows: [
        '...Y...',
        '..OYO..',
        'OOOYOOO',
        '.OYYYO.',
        '..OYO..',
        '.OY.YO.',
        '.O...O.'
      ]
    },

    // 16x16 crescent moon
    moon: {
      pal: {
        O: 'ink',
        Y: 'yellow'
      },
      rows: [
        '.....OOOOO......',
        '...OOYYYOO......',
        '..OYYYYYYO......',
        '..OYYYYYOO......',
        '.OYYYYYYO.......',
        '.OYYYYYO........',
        'OYYYYYYO........',
        'OYYYYYO.........',
        'OYYYYYO.........',
        'OYYYYYYO........',
        '.OYYYYYO........',
        '.OYYYYYYO.......',
        '..OYYYYYYO......',
        '..OYYYYYOO......',
        '...OOYYYOO......',
        '.....OOOOO......'
      ]
    },

    // 14x7 cloud
    cloud: {
      pal: {
        O: 'ink',
        W: 'white'
      },
      rows: [
        '....OOOOO.....',
        '..OOWWWWOO....',
        '.OWWWWWWWWO...',
        'OWWWWWWWWWWO..',
        'OWWWWWWWWWWWO.',
        '.OWWWWWWWWWWO.',
        '..OOOOOOOOOO..'
      ]
    },

    // 9x6 fish bonus collectible (faces left)
    fish: {
      pal: {
        O: 'ink',
        C: 'cream',
        K: 'ink'
      },
      rows: [
        '..OOOOO..',
        'OCKCCCO..',
        'OCCCCCCOO',
        'OCCCCCCO.',
        '.OCCCO...',
        '..OOO....'
      ]
    }
  };

  // Draw a sprite at integer pixel position with integer scale, optionally
  // mirrored horizontally, one ctx.fillRect per non-transparent pixel.
  window.drawSprite = function (ctx, sprite, x, y, scale, flipX) {
    scale = scale | 0;
    if (scale < 1) scale = 1;
    var rows = sprite.rows;
    var pal = sprite.pal;
    var w = rows[0].length;
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      for (var c = 0; c < w; c++) {
        var ch = flipX ? row.charAt(w - 1 - c) : row.charAt(c);
        if (ch === '.') continue;
        var key = pal[ch];
        if (!key) continue;
        var color = window.PALETTE[key];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
      }
    }
  };
})();
