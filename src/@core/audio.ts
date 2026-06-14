/** Tiny native-audio wrapper
 *
 * One HTMLAudioElement per sound. Supports looping, volume, and howler-style
 * sprite ranges ([offsetMs, durationMs]) via currentTime + a stop timer. Plays
 * are sequential per sound, which is all the engine needs (walk loop, one-shot
 * success, sequential dialogue blips). */
export type Sound = {
  play: (sprite?: string) => void;
  stop: () => void;
  volume: (value: number) => void;
};

export type SoundOptions = {
  loop?: boolean;
  volume?: number;
  /** Named ranges within the file, each `[offsetMs, durationMs]`. */
  sprites?: Record<string, [number, number]>;
};

export function createSound(src: string, options: SoundOptions = {}): Sound {
  const el = new Audio(src);
  el.loop = options.loop ?? false;
  el.volume = options.volume ?? 1;

  let stopTimer: ReturnType<typeof setTimeout> | undefined;

  // Pausing a sprite mid-play (or autoplay restrictions) rejects the play()
  // promise; that's expected, so swallow it.
  const start = () => el.play().catch(() => {});

  return {
    play(sprite) {
      clearTimeout(stopTimer);
      const range = sprite && options.sprites?.[sprite];
      if (range) {
        const [offset, duration] = range;
        el.currentTime = offset / 1000;
        start();
        stopTimer = setTimeout(() => el.pause(), duration);
      } else {
        el.currentTime = 0;
        start();
      }
    },
    stop() {
      clearTimeout(stopTimer);
      el.pause();
      el.currentTime = 0;
    },
    volume(value) {
      el.volume = value;
    },
  };
}

// --- Synthesized default sounds (Web Audio, zero assets) ---

let audioCtx: AudioContext | undefined;
const getCtx = (): AudioContext => {
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audioCtx = new Ctx();
  }
  // First play happens after the START click, so resuming here is allowed.
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
};

// Play a single enveloped tone.
const tone = (
  freq: number,
  durationMs: number,
  volume: number,
  type: OscillatorType = "square",
  delay = 0
) => {
  const ctx = getCtx();
  const t0 = ctx.currentTime + delay;
  const end = t0 + durationMs / 1000;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(end + 0.02);
};

// A short filtered-noise burst — used for the soft footstep.
const noiseBurst = (
  durationMs: number,
  volume: number,
  cutoff: number,
  delay = 0
) => {
  const ctx = getCtx();
  const t0 = ctx.currentTime + delay;
  const end = t0 + durationMs / 1000;

  const frames = Math.max(1, Math.ceil((ctx.sampleRate * durationMs) / 1000));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
  src.stop(end + 0.02);
};

export type SynthKind = "walk" | "success" | "blip";

/** A default sound effect generated on the fly, so the engine needs no audio
 *  files. Tuned to resemble the original sample-based sounds. Authors can
 *  override any of these with their own via the `sounds` config. */
export function createSynthSound(kind: SynthKind, volume: number): Sound {
  let vol = volume;

  if (kind === "walk") {
    // The original is a soft, quiet broadband footstep, not a tone: a short
    // low-passed noise burst repeated at a walking cadence.
    let timer: ReturnType<typeof setInterval> | undefined;
    const step = () => noiseBurst(90, vol * 0.5, 800);
    return {
      play() {
        if (timer) return;
        step();
        timer = setInterval(step, 430);
      },
      stop() {
        if (timer) {
          clearInterval(timer);
          timer = undefined;
        }
      },
      volume(v) {
        vol = v;
      },
    };
  }

  if (kind === "success") {
    // The original resolves on an A-major arpeggio (A4 → C#5 → E5); echo the
    // top note to land bright like the sample does.
    return {
      play() {
        const notes: [number, number, number][] = [
          [440.0, 0.0, 130], // A4
          [554.37, 0.11, 130], // C#5
          [659.25, 0.22, 150], // E5
          [659.25, 0.42, 200], // E5 (held)
        ];
        notes.forEach(([f, delay, dur]) =>
          tone(f, dur, vol, "triangle", delay)
        );
      },
      stop() {},
      volume(v) {
        vol = v;
      },
    };
  }

  // blip — the original is a constant ~784 Hz (G5) buzzy tone; only the length
  // varies with how much text there is.
  const durations: Record<string, number> = {
    short: 110,
    regular: 150,
    long: 200,
  };
  return {
    play(sprite) {
      const dur = durations[sprite ?? "regular"] ?? durations.regular;
      tone(783.99, dur, vol, "square");
    },
    stop() {},
    volume(v) {
      vol = v;
    },
  };
}
