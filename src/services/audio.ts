import type { Howl as HowlT } from "howler";

/** Stummschaltbarer Audio-Manager. Sounddateien später unter /public/sfx/<name>.mp3 ablegen. */
export type Sfx = "coin" | "click" | "newspaper" | "build" | "espresso";
const cache = new Map<Sfx, HowlT>();
let muted = false;
let volume = 0.6;

export function setMuted(m: boolean) { muted = m; import("howler").then(({ Howler }) => Howler.mute(m)); }
export function setVolume(v: number) { volume = v; import("howler").then(({ Howler }) => Howler.volume(v)); }
export function isMuted() { return muted; }

export async function play(name: Sfx) {
  if (muted || typeof window === "undefined") return;
  let h = cache.get(name);
  if (!h) {
    const { Howl } = await import("howler");
    h = new Howl({ src: [`/sfx/${name}.mp3`], volume, preload: true, onloaderror: () => {} });
    cache.set(name, h);
  }
  h.play();
}
