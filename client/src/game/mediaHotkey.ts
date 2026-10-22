// The last mounted audio/video block registers itself here so the global
// Space hotkey can play/pause "whatever media is currently on screen"
// without every screen having to thread a ref through.
let activeToggle: (() => void) | null = null;

export function registerActiveMediaToggle(toggle: () => void): () => void {
  activeToggle = toggle;
  return () => {
    if (activeToggle === toggle) activeToggle = null;
  };
}

export function toggleActiveMedia(): void {
  activeToggle?.();
}
