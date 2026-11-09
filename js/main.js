/* FAT CAT CLIMB — bootstrap guard.
   js/game.js is a self-starting IIFE (it calls reset() and
   requestAnimationFrame itself), so this file must NOT construct a
   Game or start a second loop. It only verifies the canvas exists and
   logs that the game self-booted. */
(function () {
  'use strict';

  function check() {
    var canvas = document.getElementById('game');
    if (!canvas) {
      console.error('FAT CAT CLIMB: canvas #game not found in the DOM.');
      return;
    }
    console.log('FAT CAT CLIMB: game self-booted from js/game.js on canvas #game.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', check, { once: true });
  } else {
    check();
  }
})();
