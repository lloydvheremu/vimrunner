
import { useState, useCallback, useEffect } from 'react';
import { VimMode, Position } from '../types';

/**
 * A specialized hook that converts raw keyboard events into Vim motions.
 * 
 * Think of this as a "Protocol Converter":
 * It listens for raw key signals and translates them into meaningful game intent 
 * (Move, Mode Switch, Escape) based on the current "State" (Vim Mode).
 * 
 * @param mode The current active Vim mode (NORMAL, INSERT, etc.)
 * @param onMove Callback for handling position deltas (e.g. {x: 1, y: 0})
 * @param setMode Callback to update the game's mode
 * @param onEscape Callback for the escape key
 */
export function useVimParser(
  mode: VimMode,
  onMove: (delta: Position) => void,
  setMode: (mode: VimMode) => void,
  onEscape: () => void
) {
  const [buffer, setBuffer] = useState('');

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 1. GLOBAL ESCAPE: Resets the state machine immediately.
    if (e.key === 'Escape') {
      setBuffer('');
      onEscape();
      setMode(VimMode.NORMAL);
      return;
    }

    const keyLower = e.key.toLowerCase();

    // 2. NORMAL MODE: The "Navigation" state.
    // In this state, characters are interpreted as verbs (h=left, j=down, etc.)
    if (mode === VimMode.NORMAL) {
      // Prevent default browser shortcuts for game keys (e.g. j/k scrolling the window)
      if (['h', 'j', 'k', 'l', 'w', 'b', 'e', 'i', 'v', ':'].includes(keyLower)) {
        e.preventDefault();
      }

      switch (keyLower) {
        case 'h': onMove({ x: -1, y: 0 }); break;
        case 'j': onMove({ x: 0, y: 1 }); break;
        case 'k': onMove({ x: 0, y: -1 }); break;
        case 'l': onMove({ x: 1, y: 0 }); break;
        case 'i': setMode(VimMode.INSERT); break;
        case 'v': setMode(VimMode.VISUAL); break;
        case ':': setMode(VimMode.COMMAND); break;
        default:
          // Unhandled keys go into the buffer (for future chord support like 'dd')
          if (e.key.length === 1) {
            setBuffer(prev => prev + e.key);
          }
      }
    }
  }, [mode, onMove, setMode, onEscape]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { buffer, setBuffer };
}
