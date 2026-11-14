/**
 * Procedural Web Audio Sound FX for Beasts Tactical Arena
 * Zero external audio dependencies - generates rich synthesis natively.
 */

class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.introAudio = null;
    this._introTargetVol = 0.45;
    this._introFadeTimer = null;
    this._introPendingGesture = false;
    this.desiredBgm = null;
    this._activeBgm = null;
    this._bgmTimer = null;
    this._bgmStep = 0;
    this._bgmNextTime = 0;
    this._bgmGain = null;
    this._bgmNoiseBuf = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted') {
      this.ctx.resume().catch(() => {});
    }
  }

  unlock() {
    this.init();
    if (!this.ctx || this._unlocked) return;
    try {
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
      if (this.ctx.state === 'running') {
        this._unlocked = true;
      }
    } catch (_) {}
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopIntroMusic(0);
      this._pauseBgmScheduler();
    } else if (this.isIntroScreenVisible()) {
      this.playIntroMusic();
    } else if (this.desiredBgm) {
      this.playBgm(this.desiredBgm);
    }
    return this.enabled;
  }

  isIntroScreenVisible() {
    const introModal = document.getElementById('intro-modal');
    return Boolean(introModal && !introModal.classList.contains('hidden'));
  }

  playIntroMusic() {
    if (!this.enabled || !this.isIntroScreenVisible()) return;
    if (this._introFadeTimer) {
      clearInterval(this._introFadeTimer);
      this._introFadeTimer = null;
    }
    if (!this.introAudio) {
      this.introAudio = new Audio('Audio/Iron_Giants_Rise.mp3');
      this.introAudio.loop = true;
      this.introAudio.preload = 'auto';
    }
    this.introAudio.volume = this._introTargetVol;
    if (!this.introAudio.paused) {
      this._introPendingGesture = false;
      return;
    }
    const p = this.introAudio.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        this._introPendingGesture = false;
      }).catch(() => {
        // Browser blocked unmuted autoplay before first user interaction
        this._introPendingGesture = true;
      });
    }
  }

  stopIntroMusic(fadeMs = 450) {
    this._introPendingGesture = false;
    if (this._introFadeTimer) {
      clearInterval(this._introFadeTimer);
      this._introFadeTimer = null;
    }
    if (!this.introAudio) return;
    if (this.introAudio.paused || fadeMs <= 0) {
      this.introAudio.pause();
      this.introAudio.currentTime = 0;
      this.introAudio.volume = this._introTargetVol;
      return;
    }
    const audio = this.introAudio;
    const startVol = audio.volume;
    const steps = 10;
    const stepMs = Math.max(16, Math.floor(fadeMs / steps));
    let step = 0;
    this._introFadeTimer = setInterval(() => {
      step++;
      const ratio = Math.max(0, 1 - step / steps);
      audio.volume = startVol * ratio;
      if (step >= steps) {
        clearInterval(this._introFadeTimer);
        this._introFadeTimer = null;
        audio.pause();
        audio.currentTime = 0;
        audio.volume = this._introTargetVol;
      }
    }, stepMs);
  }

  // Background Music (Overworld & Battle) via Web Audio lookahead scheduler
  playBgm(track) {
    this.desiredBgm = track || null;
    if (!track || !this.enabled) {
      this._pauseBgmScheduler();
      return;
    }
    this.init();
    if (!this.ctx) return;
    if (this._activeBgm === track && this._bgmTimer) return;
    this._pauseBgmScheduler();
    this._activeBgm = track;
    this._bgmStep = 0;
    this._bgmNextTime = this.ctx.currentTime + 0.06;

    if (!this._bgmGain) {
      this._bgmGain = this.ctx.createGain();
      this._bgmGain.connect(this.ctx.destination);
    }
    const targetVol = track === 'battle' ? 0.26 : 0.22;
    this._bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this._bgmGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this._bgmGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 0.35);

    const stepDur = track === 'battle' ? 0.105 : 0.29;
    this._bgmTimer = setInterval(() => {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
      const horizon = this.ctx.currentTime + 0.22;
      while (this._bgmNextTime < horizon) {
        if (this._activeBgm === 'battle') {
          this._scheduleBattleStep(this._bgmStep, this._bgmNextTime, stepDur);
        } else {
          this._scheduleOverworldStep(this._bgmStep, this._bgmNextTime, stepDur);
        }
        this._bgmNextTime += stepDur;
        this._bgmStep = (this._bgmStep + 1) % 32;
      }
    }, 75);
  }

  stopBgm() {
    this.desiredBgm = null;
    this._pauseBgmScheduler();
  }

  _pauseBgmScheduler() {
    this._activeBgm = null;
    if (this._bgmTimer) {
      clearInterval(this._bgmTimer);
      this._bgmTimer = null;
    }
    if (this._bgmGain && this.ctx) {
      const now = this.ctx.currentTime;
      this._bgmGain.gain.cancelScheduledValues(now);
      this._bgmGain.gain.setTargetAtTime(0.0001, now, 0.08);
    }
  }

  _playBgmTone(freq, time, dur, type, vol, filterFreq = 0) {
    if (!freq || !this.ctx || !this._bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(vol, time + Math.min(0.02, dur * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0008, time + dur);
    if (filterFreq > 0) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, time);
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(this._bgmGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  _playBgmDrum(kind, time) {
    if (!this.ctx || !this._bgmGain) return;
    if (kind === 'kick') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(135, time);
      osc.frequency.exponentialRampToValueAtTime(42, time + 0.11);
      gain.gain.setValueAtTime(0.42, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(gain);
      gain.connect(this._bgmGain);
      osc.start(time);
      osc.stop(time + 0.13);
      return;
    }
    if (!this._bgmNoiseBuf) {
      const len = Math.floor(this.ctx.sampleRate * 0.08);
      this._bgmNoiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this._bgmNoiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this._bgmNoiseBuf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(kind === 'snare' ? 1400 : 5200, time);
    const gain = this.ctx.createGain();
    const peak = kind === 'snare' ? 0.18 : 0.09;
    const dur = kind === 'snare' ? 0.08 : 0.04;
    gain.gain.setValueAtTime(peak, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    src.connect(hp);
    hp.connect(gain);
    gain.connect(this._bgmGain);
    src.start(time);
    src.stop(time + dur + 0.01);
  }

  _scheduleOverworldStep(step, time, stepDur) {
    // Cozy pastoral C major -> G -> Am -> F loop (32 eighth-note steps)
    const bass = [
      130.81, 0, 196.00, 0, 130.81, 0, 196.00, 0,
      98.00,  0, 146.83, 0, 98.00,  0, 146.83, 0,
      110.00, 0, 164.81, 0, 110.00, 0, 164.81, 0,
      87.31,  0, 130.81, 0, 98.00,  0, 146.83, 0
    ];
    const arp = [
      261.63, 329.63, 392.00, 329.63, 261.63, 329.63, 392.00, 329.63,
      246.94, 293.66, 392.00, 293.66, 246.94, 293.66, 392.00, 293.66,
      220.00, 261.63, 329.63, 261.63, 220.00, 261.63, 329.63, 261.63,
      174.61, 220.00, 261.63, 220.00, 196.00, 246.94, 293.66, 246.94
    ];
    const lead = [
      659.25, 0, 783.99, 659.25, 587.33, 523.25, 587.33, 0,
      587.33, 0, 659.25, 587.33, 493.88, 0,      392.00, 0,
      523.25, 0, 659.25, 880.00, 783.99, 659.25, 523.25, 0,
      587.33, 523.25, 440.00, 0, 392.00, 493.88, 587.33, 0
    ];
    if (bass[step]) this._playBgmTone(bass[step], time, stepDur * 1.7, 'triangle', 0.22, 600);
    if (arp[step]) this._playBgmTone(arp[step], time, stepDur * 0.9, 'sine', 0.09);
    if (lead[step]) this._playBgmTone(lead[step], time, stepDur * 1.35, 'triangle', 0.16, 2400);
  }

  _scheduleBattleStep(step, time, stepDur) {
    // Intense driving D minor tactical battle loop (32 sixteenth-note steps)
    const bass = [
      73.42, 73.42, 0, 73.42, 87.31, 0, 73.42, 0,
      73.42, 73.42, 0, 98.00, 87.31, 0, 65.41, 0,
      58.27, 58.27, 0, 58.27, 65.41, 0, 58.27, 0,
      65.41, 65.41, 0, 82.41, 87.31, 0, 110.00, 98.00
    ];
    const lead = [
      293.66, 0, 349.23, 0, 440.00, 0, 466.16, 440.00,
      349.23, 0, 329.63, 0, 293.66, 0, 261.63, 0,
      233.08, 0, 293.66, 0, 349.23, 0, 392.00, 349.23,
      329.63, 0, 440.00, 0, 523.25, 0, 466.16, 440.00
    ];
    if (bass[step]) this._playBgmTone(bass[step], time, stepDur * 0.88, 'sawtooth', 0.24, 520);
    if (lead[step]) {
      this._playBgmTone(lead[step], time, stepDur * 1.5, 'square', 0.11, 1800);
      this._playBgmTone(lead[step] * 1.005, time, stepDur * 1.5, 'sawtooth', 0.08, 2200);
    }
    if (step % 4 === 0 || step === 14 || step === 30) this._playBgmDrum('kick', time);
    if (step % 8 === 4) this._playBgmDrum('snare', time);
    if (step % 2 === 1) this._playBgmDrum('hat', time);
  }

  // UI Click
  playClick() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Footstep / Board Move
  playMove() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  // Fire Blast / Trails of Fire
  playFire() {
    if (!this.enabled) return;
    this.init();
    // Noise buffer for flame roar
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.15);
    filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  // Rock Barrier / Heavy Stone Impact
  playRock() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  // Werewolf Howl / Roar
  playHowl() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.35);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  // Poison Spit / Acid Hiss
  playPoison() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Hit Impact / Damage
  playHit() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  // Healing / Regrowth / Rebirth
  playHeal() {
    if (!this.enabled) return;
    this.init();
    const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.25);
    });
  }

  // Defeat / Elimination
  playDefeat() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  // Branch Whip / Nature Slash
  playWhip() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  // Loud TV Static Snap + Heroic Mythos Commercial Fanfare
  playTvCommercial() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    // 1. Loud CRT static burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.85;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.45, now);
    nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    noise.connect(nGain);
    nGain.connect(this.ctx.destination);
    noise.start(now);

    // 2. Brass-like Commercial Fanfare Notes (G4 -> C5 -> E5 -> G5!)
    const fanfare = [
      { f: 392.00, t: 0.18, d: 0.14 },
      { f: 523.25, t: 0.32, d: 0.14 },
      { f: 659.25, t: 0.46, d: 0.16 },
      { f: 783.99, t: 0.62, d: 0.55 }
    ];
    fanfare.forEach(({ f, t, d }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now + t);

      gain.gain.setValueAtTime(0.01, now + t);
      gain.gain.linearRampToValueAtTime(0.28, now + t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.005, now + t + d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + d);
    });
  }

  // Suspenseful Ascending Runic Drone while Charging / Ripping a Mythos Booster Pack
  playPackSuspense() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(110, now);
    osc1.frequency.exponentialRampToValueAtTime(330, now + 0.65);
    osc2.frequency.setValueAtTime(164.81, now);
    osc2.frequency.exponentialRampToValueAtTime(493.88, now + 0.65);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.68);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.68);
    osc2.stop(now + 0.68);
  }

  // Foil Ripping Crunch + Celestial Shockwave Boom when tearing open a Booster Pack!
  playPackRip() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    // 1. Metallic Foil Tear (Bandpass white noise sweep)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.42);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(4800, now + 0.38);
    filter.Q.setValueAtTime(2.2, now);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.55, now);
    nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.ctx.destination);
    noise.start(now);

    // 2. Deep Sub-Bass Impact Boom + Magical Shimmer Chime
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now + 0.18);
    sub.frequency.exponentialRampToValueAtTime(36, now + 0.85);
    subGain.gain.setValueAtTime(0.5, now + 0.18);
    subGain.gain.exponentialRampToValueAtTime(0.005, now + 0.85);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now + 0.18);
    sub.stop(now + 0.85);

    const sparkles = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    sparkles.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + 0.22 + idx * 0.055);
      g.gain.setValueAtTime(0.18, now + 0.22 + idx * 0.055);
      g.gain.exponentialRampToValueAtTime(0.003, now + 0.65 + idx * 0.055);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + 0.22 + idx * 0.055);
      osc.stop(now + 0.65 + idx * 0.055);
    });
  }

  // Dramatic 3D Card Flip & Rarity Reveal (isMythic = 4-Star Holographic Pull!)
  playCardFlipReveal(isMythic = false) {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    // Crisp card whoosh
    const whooshOsc = this.ctx.createOscillator();
    const whooshGain = this.ctx.createGain();
    whooshOsc.type = 'triangle';
    whooshOsc.frequency.setValueAtTime(220, now);
    whooshOsc.frequency.exponentialRampToValueAtTime(680, now + 0.14);
    whooshGain.gain.setValueAtTime(0.22, now);
    whooshGain.gain.exponentialRampToValueAtTime(0.005, now + 0.15);
    whooshOsc.connect(whooshGain);
    whooshGain.connect(this.ctx.destination);
    whooshOsc.start(now);
    whooshOsc.stop(now + 0.15);

    if (isMythic) {
      // Heroic 4-Star Mythic Gold Fanfare!
      const chord = [523.25, 659.25, 783.99, 1046.50, 1567.98];
      chord.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.12 + i * 0.06);
        g.gain.setValueAtTime(0.22, now + 0.12 + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.004, now + 0.95 + i * 0.06);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(now + 0.12 + i * 0.06);
        osc.stop(now + 0.95 + i * 0.06);
      });
    } else {
      // Clean Rare 2-Star Crystal Chime
      const notes = [440, 554.37, 659.25];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.10 + i * 0.05);
        g.gain.setValueAtTime(0.18, now + 0.10 + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.004, now + 0.48 + i * 0.05);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(now + 0.10 + i * 0.05);
        osc.stop(now + 0.48 + i * 0.05);
      });
    }
  }

  // Metallic 3D Coin Flip Spin (Fluttering ascending harmonic ring)
  playCoinFlip() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    const count = 7;
    for (let i = 0; i < count; i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      const freq = 1100 + i * 150 + (i % 2 === 0 ? 90 : -70);
      osc.frequency.setValueAtTime(freq, now + i * 0.16);
      g.gain.setValueAtTime(0.18, now + i * 0.16);
      g.gain.exponentialRampToValueAtTime(0.005, now + i * 0.16 + 0.11);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.11);
    }
  }

  // Metallic Coin Landing Clink & Resonant Chime
  playCoinLand() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    // Sharp metallic impact click
    const impactOsc = this.ctx.createOscillator();
    const impactGain = this.ctx.createGain();
    impactOsc.type = 'square';
    impactOsc.frequency.setValueAtTime(980, now);
    impactOsc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
    impactGain.gain.setValueAtTime(0.24, now);
    impactGain.gain.exponentialRampToValueAtTime(0.005, now + 0.09);
    impactOsc.connect(impactGain);
    impactGain.connect(this.ctx.destination);
    impactOsc.start(now);
    impactOsc.stop(now + 0.09);

    // Resonating crystal bell chime
    const bellChord = [1046.50, 1318.51, 1567.98, 2093.00];
    bellChord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.02);
      g.gain.setValueAtTime(0.16 / (idx + 1), now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.002, now + 0.75);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + 0.02);
      osc.stop(now + 0.75);
    });
  }

  // Lullaby Falling Arpeggio when going to sleep in bed
  playSleepChime() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const notes = [659.25, 523.25, 392.00, 329.63, 261.63];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.14);
      g.gain.setValueAtTime(0.14, now + i * 0.14);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.65);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.65);
    });
  }

  // Ascending Sunrise Morning Dawn Chime when waking up rested
  playMorningChime() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = i === chord.length - 1 ? 'triangle' : 'sine';
      const startTime = now + i * 0.10;
      osc.frequency.setValueAtTime(freq, startTime);
      g.gain.setValueAtTime(0.15, startTime);
      g.gain.exponentialRampToValueAtTime(0.002, startTime + (i === chord.length - 1 ? 1.2 : 0.6));
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + (i === chord.length - 1 ? 1.2 : 0.6));
    });
  }

  // Card Attack Swoosh & Strike
  playAttack() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    // Whoosh noise sweep
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.16);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.8;
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.15);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.01, now);
    nGain.gain.linearRampToValueAtTime(0.28, now + 0.03);
    nGain.gain.exponentialRampToValueAtTime(0.005, now + 0.16);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.ctx.destination);
    noise.start(now);

    // Punchy strike transient
    const osc = this.ctx.createOscillator();
    const oGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now + 0.02);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.14);
    oGain.gain.setValueAtTime(0.32, now + 0.02);
    oGain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);
    osc.connect(oGain);
    oGain.connect(this.ctx.destination);
    osc.start(now + 0.02);
    osc.stop(now + 0.14);
  }

  // Metallic Armor Clank when an attack hits Armor
  playArmorHit() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const freqs = [480, 745, 1190];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i === 0 ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.88, now + 0.22);

      gain.gain.setValueAtTime(0.18 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.002, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    });
  }

  // Crystalline Energy Shatter when a Shield breaks
  playShieldBreak() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    // High-pass shatter noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.28);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2200, now);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.28, now);
    nGain.gain.exponentialRampToValueAtTime(0.003, now + 0.28);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.ctx.destination);
    noise.start(now);

    // Cascading crystalline glass shards
    const shards = [1960, 1540, 2320, 1180, 880];
    shards.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const t = now + idx * 0.035;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.72, t + 0.14);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.002, t + 0.14);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    });
  }
}

const sounds = new SoundController();
window.sounds = sounds;
window.soundFX = sounds;

// Unlock Web Audio on first mobile touch / pointer / key gesture and resume on tab focus
['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'].forEach(evt => {
  document.addEventListener(evt, () => {
    sounds.unlock();
    if (sounds._introPendingGesture && sounds.enabled && sounds.isIntroScreenVisible()) {
      sounds.playIntroMusic();
    } else if (sounds.desiredBgm && !sounds._activeBgm && sounds.enabled && !sounds.isIntroScreenVisible()) {
      sounds.playBgm(sounds.desiredBgm);
    }
  }, { passive: true, capture: true });
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (sounds.introAudio && !sounds.introAudio.paused) {
      sounds.introAudio.pause();
    }
    sounds._pauseBgmScheduler();
  } else if (sounds.enabled) {
    sounds.init();
    if (sounds.isIntroScreenVisible()) {
      sounds.playIntroMusic();
    } else if (sounds.desiredBgm) {
      sounds.playBgm(sounds.desiredBgm);
    }
  }
});
