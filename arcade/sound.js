/**
 * Synthesised sound for the SELOT Arcade client.
 *
 * Every cue is generated with the WebAudio API — there are no audio files and
 * no dependencies. The AudioContext is created on the first user gesture so
 * the browser autoplay policy is never violated, every playback call is
 * guarded, and a host without Web Audio plays silently instead of failing.
 */
const arcadeSound = (() => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const MASTER_LEVEL = 0.55;
  const RELEASE = 0.02;

  let context = null;
  let master = null;
  let noiseBuffer = null;
  let bus = null;
  let enabled = true;
  let resuming = false;

  /* -- plumbing ---------------------------------------------------------- */

  function acquire() {
    if (!AudioContextClass) return null;
    if (!context) {
      try {
        context = new AudioContextClass();
        master = context.createGain();
        master.gain.value = MASTER_LEVEL;
        master.connect(context.destination);
      } catch {
        context = null;
        master = null;
        return null;
      }
    }
    if (context.state !== "suspended") {
      resuming = false;
      return context;
    }
    if (!resuming) resume();
    return context;
  }

  /** Ask the browser to let the context play; safe to call repeatedly. */
  function resume() {
    if (!context || context.state !== "suspended") return;
    resuming = true;
    try {
      const pending = context.resume();
      if (pending && typeof pending.then === "function") {
        pending.then(() => { resuming = false; }, () => { resuming = false; });
      }
    } catch {
      /* the context stays suspended, cues simply do not sound */
    }
  }

  /** Every cue of one sequence shares a bus so a new spin can silence it. */
  function openBus() {
    if (bus) return bus;
    const ctx = acquire();
    if (!ctx || !master) return null;
    try {
      bus = ctx.createGain();
      bus.gain.value = 1;
      bus.connect(master);
    } catch {
      bus = null;
    }
    return bus;
  }

  function releaseBus() {
    if (!bus || !context) return;
    const closing = bus;
    bus = null;
    try {
      const now = context.currentTime;
      closing.gain.cancelScheduledValues(now);
      closing.gain.setValueAtTime(closing.gain.value, now);
      closing.gain.linearRampToValueAtTime(0.0001, now + RELEASE);
    } catch {
      /* the bus is disconnected regardless */
    }
    setTimeout(() => {
      try {
        closing.disconnect();
      } catch {
        /* already gone */
      }
    }, 120);
  }

  function noise(ctx) {
    if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
      const length = Math.floor(ctx.sampleRate * 0.5);
      noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let index = 0; index < length; index++) data[index] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  /* -- primitives -------------------------------------------------------- */

  /** Short filtered noise burst — the click a reel makes over a symbol. */
  function tick(at, tone) {
    const ctx = acquire();
    const target = openBus();
    if (!ctx || !target) return;
    try {
      const source = ctx.createBufferSource();
      source.buffer = noise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = tone;
      filter.Q.value = 1.4;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.3, at + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(target);
      source.start(at);
      source.stop(at + 0.07);
    } catch {
      /* a dropped tick is better than a broken spin */
    }
  }

  /** Low thud for a reel coming to rest. */
  function land(at) {
    const ctx = acquire();
    const target = openBus();
    if (!ctx || !target) return;
    try {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(165, at);
      osc.frequency.exponentialRampToValueAtTime(48, at + 0.12);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.5, at + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.19);
      osc.connect(gain);
      gain.connect(target);
      osc.start(at);
      osc.stop(at + 0.22);
    } catch {
      /* a dropped thud is better than a broken spin */
    }
  }

  /** One plucked note with a soft attack and an exponential decay. */
  function note(at, frequency, duration, type, peak, cutoff) {
    const ctx = acquire();
    const target = openBus();
    if (!ctx || !target) return;
    try {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, at);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      let tail = osc;
      if (cutoff) {
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(cutoff, at);
        filter.Q.value = 0.8;
        osc.connect(filter);
        tail = filter;
      }
      tail.connect(gain);
      gain.connect(target);
      osc.start(at);
      osc.stop(at + duration + 0.03);
    } catch {
      /* a dropped note is better than a broken spin */
    }
  }

  /* -- cues -------------------------------------------------------------- */

  /** Pitch of the line-win chime: every doubling of the payout lifts it. */
  function winPitch(multiple) {
    const size = Math.max(1, Number(multiple) || 0);
    const steps = Math.min(19, Math.round(Math.log2(size) * 4));
    return 523.25 * Math.pow(2, steps / 12);
  }

  function playTick(at) {
    const ctx = acquire();
    if (!ctx) return;
    tick(typeof at === "number" ? at : ctx.currentTime + 0.01, 2400);
  }

  function playLand(at) {
    const ctx = acquire();
    if (!ctx) return;
    land(typeof at === "number" ? at : ctx.currentTime + 0.01);
  }

  /** Rising arpeggio; a larger payout starts the chime on a higher note. */
  function playWin(multiple, at) {
    const ctx = acquire();
    if (!ctx) return;
    const start = typeof at === "number" ? at : ctx.currentTime + 0.01;
    const root = winPitch(multiple);
    [root, root * 1.26, root * 1.5].forEach((frequency, index) => {
      note(start + index * 0.08, frequency, 0.34, "triangle", 0.26);
    });
  }

  /** Fanfare for a payout of twenty times the stake or more. */
  function playBigWin(at) {
    const ctx = acquire();
    if (!ctx) return;
    const start = typeof at === "number" ? at : ctx.currentTime + 0.01;
    [392, 523.25, 659.25, 783.99].forEach((frequency, index) => {
      note(start + index * 0.115, frequency, 0.32, "sawtooth", 0.13, 2400);
    });
    [523.25, 659.25, 783.99].forEach(frequency => {
      note(start + 0.48, frequency, 1.1, "sawtooth", 0.1, 1800);
    });
  }

  /** Ascending sting for a free-spin award. */
  function playFreeSpins(count, at) {
    const ctx = acquire();
    if (!ctx) return;
    const start = typeof at === "number" ? at : ctx.currentTime + 0.01;
    const steps = Math.min(7, 4 + Math.max(0, Number(count) || 0));
    for (let index = 0; index < steps; index++) {
      note(start + index * 0.075, 392 * Math.pow(2, index / 5), 0.26, "triangle", 0.22);
    }
    note(start + steps * 0.075, 784, 0.5, "triangle", 0.2);
  }

  /** Bright two-note ping for the daily claim. */
  function playCoin(at) {
    const ctx = acquire();
    if (!ctx) return;
    const start = typeof at === "number" ? at : ctx.currentTime + 0.01;
    note(start, 1760, 0.1, "sine", 0.24);
    note(start + 0.055, 2637, 0.22, "sine", 0.2);
  }

  /**
   * The full spin: reels turning and stopping, then whatever the spin won.
   * The reels are timed to the spin animation, and the win cues land as the
   * last reel settles.
   */
  function spin(options = {}) {
    if (!enabled) return;
    try {
      const ctx = acquire();
      if (!ctx) return;
      releaseBus();
      if (!openBus()) return;

      const reels = Math.max(1, Number(options.reels) || 5);
      const fast = Boolean(options.fast);
      const start = ctx.currentTime + 0.02;

      let landing = start;
      for (let index = 0; index < reels; index++) {
        const stop = start + (fast ? 0.01 : 0.06) + index * (fast ? 0.006 : 0.048);
        landing = stop;
        const tone = 2100 + index * 260;
        const passes = [];
        let moment = stop - 0.012;
        let interval = fast ? 0.03 : 0.038;
        while (moment > start) {
          passes.unshift(moment);
          moment -= interval;
          interval = Math.max(interval * 0.78, fast ? 0.018 : 0.022);
        }
        passes.forEach(pass => tick(pass, tone));
        land(stop);
      }

      const multiple = Number(options.multiple) || 0;
      const freeSpins = Math.max(0, Number(options.freeSpins) || 0);
      let cursor = landing + 0.015;
      if (multiple > 0) {
        playWin(multiple, cursor);
        cursor += 0.3;
      }
      if (freeSpins > 0) {
        playFreeSpins(freeSpins, cursor);
        cursor += 0.34;
      }
      if (multiple >= 20) playBigWin(cursor);
    } catch {
      /* silence is a valid outcome */
    }
  }

  /** The daily claim: a coin drops into the balance. */
  function coin(at) {
    if (!enabled) return;
    try {
      const ctx = acquire();
      if (!ctx) return;
      releaseBus();
      if (!openBus()) return;
      playCoin(typeof at === "number" ? at : ctx.currentTime + 0.01);
    } catch {
      /* silence is a valid outcome */
    }
  }

  /* -- controls ---------------------------------------------------------- */

  /** Call from a user gesture so the context starts allowed to play. */
  function unlock() {
    try {
      acquire();
      resume();
    } catch {
      /* audio is optional */
    }
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled) releaseBus();
  }

  function isEnabled() {
    return enabled;
  }

  function cancel() {
    try {
      releaseBus();
    } catch {
      /* nothing to cancel */
    }
  }

  return {
    unlock,
    setEnabled,
    isEnabled,
    cancel,
    spin,
    coin,
    tick: playTick,
    land: playLand,
    win: playWin,
    bigWin: playBigWin,
    freeSpins: playFreeSpins,
  };
})();
