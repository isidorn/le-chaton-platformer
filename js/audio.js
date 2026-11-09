/* window.SFX — pure Web Audio API sound effects, no external files. */
(function () {
  'use strict';

  var ctx = null;

  function getCtx() {
    try {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) {
      return null;
    }
  }

  function tone(opts) {
    try {
      if (SFX.muted) return;
      var c = getCtx();
      if (!c) return;
      var o = opts || {};
      var freq = o.freq || 440;
      var freqEnd = (o.freqEnd !== undefined) ? o.freqEnd : freq;
      var dur = o.dur || 0.1;
      var type = o.type || 'sine';
      var vol = (o.vol !== undefined) ? o.vol : 0.2;
      var delay = (o.delay !== undefined) ? o.delay : 0;

      var start = c.currentTime + delay;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), start + dur);
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    } catch (e) { /* no-op */ }
  }

  var SFX = {
    muted: false,

    init: function () {
      return !!getCtx();
    },

    toggleMute: function () {
      SFX.muted = !SFX.muted;
      return SFX.muted;
    },

    jump: function () {
      tone({ freq: 300, freqEnd: 700, dur: 0.12, type: 'square', vol: 0.15 });
    },

    land: function () {
      tone({ freq: 180, freqEnd: 90, dur: 0.06, type: 'triangle', vol: 0.08 });
    },

    breakPlat: function () {
      tone({ freq: 400, freqEnd: 60, dur: 0.15, type: 'sawtooth', vol: 0.12 });
    },

    star: function () {
      var notes = [880, 1320, 1760];
      for (var i = 0; i < notes.length; i++) {
        tone({ freq: notes[i], dur: 0.05, type: 'sine', vol: 0.12, delay: i * 0.05 });
      }
    },

    milestone: function () {
      var notes = [523, 659, 784, 1046];
      for (var i = 0; i < notes.length; i++) {
        tone({ freq: notes[i], dur: 0.12, type: 'square', vol: 0.1, delay: i * 0.09 });
      }
    },

    over: function () {
      try {
        if (SFX.muted) return;
        var c = getCtx();
        if (!c) return;
        var start = c.currentTime;
        var dur = 0.8;
        var osc = c.createOscillator();
        var gain = c.createGain();
        var lfo = c.createOscillator();
        var lfoGain = c.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(392, start);
        osc.frequency.exponentialRampToValueAtTime(196, start + dur);
        lfo.frequency.setValueAtTime(6, start);
        lfoGain.gain.setValueAtTime(12, start);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(start);
        lfo.start(start);
        osc.stop(start + dur + 0.02);
        lfo.stop(start + dur + 0.02);
      } catch (e) { /* no-op */ }
    },

    ui: function () {
      tone({ freq: 660, dur: 0.05, type: 'sine', vol: 0.12 });
    },

    meow: function () {
      try {
        if (SFX.muted) return;
        var c = getCtx();
        if (!c) return;
        var start = c.currentTime;
        var dur = 0.35;

        // Two slightly detuned sawtooths bend up then down (600 -> 900 -> 400).
        var freqs = [600, 606];
        for (var i = 0; i < freqs.length; i++) {
          var osc = c.createOscillator();
          var gain = c.createGain();
          var band = c.createBiquadFilter();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freqs[i], start);
          osc.frequency.exponentialRampToValueAtTime(900, start + dur * 0.4);
          osc.frequency.exponentialRampToValueAtTime(400, start + dur);
          band.type = 'bandpass';
          band.frequency.setValueAtTime(700, start);
          band.frequency.exponentialRampToValueAtTime(900, start + dur * 0.4);
          band.frequency.exponentialRampToValueAtTime(500, start + dur);
          band.Q.value = 4;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.linearRampToValueAtTime(0.12, start + 0.04);
          gain.gain.setValueAtTime(0.12, start + dur * 0.7);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
          osc.connect(band);
          band.connect(gain);
          gain.connect(c.destination);
          osc.start(start);
          osc.stop(start + dur + 0.02);
        }
      } catch (e) { /* no-op */ }
    }
  };

  window.SFX = SFX;
})();
