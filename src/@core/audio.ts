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

export type SynthKind = "walk" | "success" | "blip";

/** A default sound effect generated on the fly, so the engine needs no audio
 *  files. Authors can override any of these with their own via the `sounds`
 *  config. */
export function createSynthSound(kind: SynthKind, volume: number): Sound {
  let vol = volume;

  if (kind === "walk") {
    // A soft, low footstep repeated while moving.
    let timer: ReturnType<typeof setInterval> | undefined;
    const step = () => tone(150, 70, vol * 0.5, "sine");
    return {
      play() {
        if (timer) return;
        step();
        timer = setInterval(step, 300);
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
    // A short ascending arpeggio.
    return {
      play() {
        [523.25, 659.25, 783.99].forEach((f, i) =>
          tone(f, 130, vol, "triangle", i * 0.09)
        );
      },
      stop() {},
      volume(v) {
        vol = v;
      },
    };
  }

  // blip — a short beep, pitched/lengthened per dialogue length.
  const ranges: Record<string, [number, number]> = {
    short: [660, 55],
    regular: [610, 90],
    long: [560, 130],
  };
  return {
    play(sprite) {
      const [freq, dur] = ranges[sprite ?? "regular"] ?? ranges.regular;
      tone(freq, dur, vol, "square");
    },
    stop() {},
    volume(v) {
      vol = v;
    },
  };
}
