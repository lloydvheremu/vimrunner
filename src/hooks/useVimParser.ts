
import { useState, useCallback, useEffect } from 'react';
import { VimMode, Position } from '../types';

export function useVimParser(
  mode: VimMode,
  onMove: (delta: Position) => void,
  setMode: (mode: VimMode) => void,
  onEscape: () => void
) {
  const [buffer, setBuffer] = useState('');

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Standard Escape handling
    if (e.key === 'Escape') {
      setBuffer('');
      onEscape();
      setMode(VimMode.NORMAL);
      return;
    }

    if (mode === VimMode.NORMAL) {
      // Prevent default browser shortcuts if possible
      if (['h', 'j', 'k', 'l', 'w', 'b', 'e', 'i', 'a', ':', 'v'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'h': onMove({ x: -1, y: 0 }); break;
        case 'j': onMove({ x: 0, y: 1 }); break;
        case 'k': onMove({ x: 0, y: -1 }); break;
        case 'l': onMove({ x: 1, y: 0 }); break;
        case 'i': setMode(VimMode.INSERT); break;
        case 'v': setMode(VimMode.VISUAL); break;
        case ':': setMode(VimMode.COMMAND); break;
        // Future combinations go here
        default:
          setBuffer(prev => prev + e.key);
      }
    } else if (mode === VimMode.INSERT) {
      // In insert mode, we mostly want to allow typing, but we can hook into special logic
      // if we are in a specific edit zone.
    }
  }, [mode, onMove, setMode, onEscape]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { buffer, setBuffer };
}
