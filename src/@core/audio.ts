/** Web Audio sound layer.
 *
 * Files are fetched once and decoded into an AudioBuffer, then played through
 * short-lived AudioBufferSourceNodes. This is sample-accurate: looping has no
 * gap and rapid plays can overlap — neither of which the old <audio>/currentTime
 * approach could do without latency. */
export type Sound = {
  play: () => void;
  stop: () => void;
  volume: (value: number) => void;
};

export type SoundOptions = {
  loop?: boolean;
  volume?: number;
  /** Called once when the source resolves, with whether it was found. */
  onResolved?: (loaded: boolean) => void;
};

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

const silent: Sound = { play() {}, stop() {}, volume() {} };

export function createSound(src: string, options: SoundOptions = {}): Sound {
  // No source configured (e.g. a sound the author chose not to provide) → silent.
  if (!src) {
    options.onResolved?.(false);
    return silent;
  }

  let buffer: AudioBuffer | undefined;
  let decoding: Promise<AudioBuffer | undefined> | undefined;
  let vol = options.volume ?? 1;
  let loopSource: AudioBufferSourceNode | undefined;
  let loopGain: GainNode | undefined;
  let loopWanted = false;

  // Fetch the bytes eagerly (no AudioContext needed), but decode lazily on the
  // first play so the context is only created after a user gesture.
  const bytes: Promise<ArrayBuffer | undefined> = fetch(src)
    .then((res) => (res.ok ? res.arrayBuffer() : undefined))
    .catch((): undefined => undefined);

  bytes.then((data) => options.onResolved?.(!!data));

  const ensureBuffer = (): Promise<AudioBuffer | undefined> => {
    if (buffer) return Promise.resolve(buffer);
    if (!decoding) {
      decoding = bytes
        .then((data) => (data ? getCtx().decodeAudioData(data) : undefined))
        .then((decoded) => (buffer = decoded))
        .catch((): undefined => undefined);
    }
    return decoding;
  };

  const playOnce = () => {
    if (!buffer) return;
    const ctx = getCtx();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    source.connect(gain).connect(ctx.destination);
    source.start();
  };

  const beginLoop = () => {
    if (!buffer || loopSource) return;
    const ctx = getCtx();
    loopSource = ctx.createBufferSource();
    loopSource.buffer = buffer;
    loopSource.loop = true;
    loopGain = ctx.createGain();
    loopGain.gain.value = vol;
    loopSource.connect(loopGain).connect(ctx.destination);
    loopSource.start();
  };

  return {
    play() {
      if (options.loop) {
        loopWanted = true;
        if (buffer) beginLoop();
        else ensureBuffer().then(() => loopWanted && beginLoop());
        return;
      }
      if (buffer) playOnce();
      else ensureBuffer().then((b) => b && playOnce());
    },
    stop() {
      loopWanted = false;
      if (loopSource) {
        try {
          loopSource.stop();
        } catch {
          /* already stopped */
        }
        loopSource = undefined;
        loopGain = undefined;
      }
    },
    volume(value) {
      vol = value;
      if (loopGain) loopGain.gain.value = value;
    },
  };
}
