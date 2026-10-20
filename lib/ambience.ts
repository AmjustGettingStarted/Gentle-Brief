import type { AmbienceChoice } from "@/lib/brief-options";

export function startAmbience(kind: Exclude<AmbienceChoice, "silent">): () => void {
  const context = new AudioContext();
  const length = context.sampleRate * 2;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let brown = 0;
  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1;
    brown = (brown + 0.02 * white) / 1.02;
    data[index] = kind === "hiss" ? brown * 3.2 : white;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = context.createBiquadFilter();
  if (kind === "rain") {
    filter.type = "bandpass";
    filter.frequency.value = 1600;
    filter.Q.value = 0.6;
  } else {
    filter.type = "lowpass";
    filter.frequency.value = 650;
  }

  const gain = context.createGain();
  gain.gain.value = kind === "rain" ? 0.04 : 0.028;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start();
  void context.resume();

  return () => {
    source.stop();
    void context.close();
  };
}
