import { INTER_ITALIC, INTER_NORMAL } from "./inter-data";

/**
 * Inter (SIL OFL), built from bytes embedded in the bundle so nothing is
 * fetched at render time.
 *
 * Deliberately not a module-level delayRender(): @remotion/media-utils
 * require()s the CommonJS build of `remotion` while this project imports the
 * ESM build, and the second instance resets window.remotion_delayRenderHandles
 * when it loads. A handle registered at import time gets dropped, its timeout
 * is never cleared, and the render aborts minutes later. The composition waits
 * on this promise from inside a component instead (see Walkthrough.tsx).
 */
let pending: Promise<void> | null = null;

const bytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export function loadInter(): Promise<void> {
  if (pending) return pending;
  pending = Promise.all(
    [
      new FontFace("Inter", bytes(INTER_NORMAL), { weight: "100 900", style: "normal" }),
      new FontFace("Inter", bytes(INTER_ITALIC), { weight: "100 900", style: "italic" }),
    ].map((f) => f.load()),
  )
    .then((loaded) => {
      const set = document.fonts as unknown as { add: (f: FontFace) => void };
      loaded.forEach((f) => set.add(f));
    })
    .catch((err) => console.error("Inter failed to load", err));
  return pending;
}
