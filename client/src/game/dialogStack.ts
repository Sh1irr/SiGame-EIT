import { useEffect } from 'react';

// Tracks currently-open modal "close" callbacks so a single global Esc
// handler can dismiss whichever dialog was opened most recently, without
// every screen needing to know about every other screen's dialogs.
const closers: Array<() => void> = [];

export function pushDialogCloser(close: () => void): () => void {
  closers.push(close);
  return () => {
    const index = closers.lastIndexOf(close);
    if (index !== -1) closers.splice(index, 1);
  };
}

export function closeTopDialog(): boolean {
  const close = closers[closers.length - 1];
  if (!close) return false;
  close();
  return true;
}

export function useEscapeToClose(onClose: () => void) {
  useEffect(() => pushDialogCloser(onClose), [onClose]);
}
