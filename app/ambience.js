/* Cobble — the sound of the place.
 *
 * No files, no network: wind, rain and the occasional bird are synthesised in
 * the WebAudio graph from a noise buffer and a couple of oscillators. It is off
 * until someone asks for it, because a page that makes noise on arrival is a
 * page people close.
 *
 * The graph:
 *
 *   noise buffer ─┬─ lowpass (gusting) ──► wind gain ─┐
 *                 └─ bandpass (steady) ──► rain gain ─┼─► master ─► out
 *   oscillator ──► envelope ─────────────► chirp gain ┘
 */
(() => {
  const STORAGE_KEY = 'cobble-ambience';
  const MASTER = 0.06;

  let ctx = null;
  let master = null;
  let nodes = null;
  let chirpTimer = null;

  const wanted = () => {
    try { return localStorage.getItem(STORAGE_KEY) === 'on'; } catch { return false; }
  };

  function noiseBuffer(context) {
    const seconds = 3;
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      /* brown-ish noise: softer than white, closer to wind */
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    return buffer;
  }

  function build(context) {
    const buffer = noiseBuffer(context);

    const wind = context.createBufferSource();
    wind.buffer = buffer;
    wind.loop = true;
    const windFilter = context.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 420;
    const windGain = context.createGain();
    windGain.gain.value = 0.5;

    /* a slow LFO on the filter makes the wind gust instead of hiss */
    const lfo = context.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoDepth = context.createGain();
    lfoDepth.gain.value = 220;
    lfo.connect(lfoDepth).connect(windFilter.frequency);

    const rain = context.createBufferSource();
    rain.buffer = buffer;
    rain.loop = true;
    const rainFilter = context.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 2600;
    rainFilter.Q.value = 0.6;
    const rainGain = context.createGain();
    rainGain.gain.value = 0.16;

    wind.connect(windFilter).connect(windGain).connect(master);
    rain.connect(rainFilter).connect(rainGain).connect(master);
    wind.start();
    rain.start();
    lfo.start();

    return { wind, rain, lfo, windFilter, rainFilter, windGain, rainGain };
  }

  function chirp() {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const base = 2200 + Math.random() * 1200;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.5, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(base * 0.9, now + 0.14);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  function scheduleChirps() {
    clearTimeout(chirpTimer);
    chirpTimer = setTimeout(() => {
      if (ctx && ctx.state === 'running') chirp();
      scheduleChirps();
    }, 4000 + Math.random() * 9000);
  }

  async function start() {
    if (ctx) { await ctx.resume(); return; }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('no WebAudio');
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    nodes = build(ctx);
    /* fade in, never arrive at full volume */
    master.gain.linearRampToValueAtTime(MASTER, ctx.currentTime + 1.6);
    scheduleChirps();
  }

  async function stop() {
    clearTimeout(chirpTimer);
    if (!ctx) return;
    try {
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      const dying = ctx;
      setTimeout(() => { dying.close().catch(() => {}); }, 600);
    } catch {}
    ctx = null; master = null; nodes = null;
  }

  /* Night is quieter and lower: the same graph, tuned. */
  window.addEventListener('cobble-night', event => {
    if (!ctx || !nodes) return;
    const night = !!event.detail?.night;
    nodes.windFilter.frequency.linearRampToValueAtTime(night ? 260 : 420, ctx.currentTime + 2);
    nodes.rainGain.gain.linearRampToValueAtTime(night ? 0.1 : 0.16, ctx.currentTime + 2);
    master.gain.linearRampToValueAtTime(night ? MASTER * 0.7 : MASTER, ctx.currentTime + 2);
  });

  window.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#ambience-toggle');
    if (!button) return;
    const paint = () => {
      const on = !!ctx;
      button.setAttribute('aria-pressed', String(on));
      const label = 'Sound';
      button.querySelector('.ambience-label').textContent = label;
      button.setAttribute('aria-label', label);
    };
    button.addEventListener('click', async () => {
      if (ctx) {
        await stop();
        try { localStorage.setItem(STORAGE_KEY, 'off'); } catch {}
      } else {
        try {
          await start();
          localStorage.setItem(STORAGE_KEY, 'on');
        } catch {
          button.querySelector('.ambience-label').textContent = 'No audio';
        }
      }
      paint();
    });
    if (wanted()) {
      /* a stored preference still needs a gesture; the first click anywhere
         turns it on, once */
      const once = async () => {
        document.removeEventListener('pointerdown', once);
        try { await start(); } catch {}
        paint();
      };
      document.addEventListener('pointerdown', once, { once: true });
    }
    paint();
  });

  window.CobbleAmbience = { start, stop, isOn: () => !!ctx, state: () => (ctx ? ctx.state : 'closed') };
})();
