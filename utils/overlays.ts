// One dismissal owner at a time: nested dialogs must not close their parents.
const overlays: Array<() => void> = [];
export function registerOverlay(close: () => void) {
  overlays.push(close);
  return () => { const index = overlays.indexOf(close); if (index >= 0) overlays.splice(index, 1); };
}
export function dismissTopOverlay() {
  const close = overlays.at(-1);
  if (!close) return false;
  close();
  return true;
}
export function isTopOverlay(close: () => void) { return overlays.at(-1) === close; }
