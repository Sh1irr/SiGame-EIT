import { useEffect, useState } from 'react';
import { useFullscreen } from '../hooks/useFullscreen';
import { useTheme } from '../hooks/useTheme';
import { closeTopDialog } from './dialogStack';
import { toggleActiveMedia } from './mediaHotkey';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

interface UseGameHotkeysOptions {
  onToggleScoresHidden: () => void;
}

// Hotkeys active everywhere in the game mode (section 7.9 of the spec):
// F fullscreen, H hide score, T theme, Space play/pause media, Esc closes
// the top-most open dialog, ? toggles the cheatsheet. Ignored while typing.
export function useGameHotkeys({ onToggleScoresHidden }: UseGameHotkeysOptions) {
  const { toggleTheme } = useTheme();
  const { toggleFullscreen } = useFullscreen();
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;

      switch (event.key) {
        case 'f':
        case 'F':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'h':
        case 'H':
          event.preventDefault();
          onToggleScoresHidden();
          break;
        case 't':
        case 'T':
          event.preventDefault();
          toggleTheme();
          break;
        case ' ':
          event.preventDefault();
          toggleActiveMedia();
          break;
        case 'Escape':
          closeTopDialog();
          break;
        case '?':
          setCheatsheetOpen((open) => !open);
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleScoresHidden, toggleFullscreen, toggleTheme]);

  return { cheatsheetOpen, closeCheatsheet: () => setCheatsheetOpen(false) };
}
