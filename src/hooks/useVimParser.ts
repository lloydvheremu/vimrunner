
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

    const keyLower = e.key.toLowerCase();

    if (mode === VimMode.NORMAL) {
      // Prevent default browser shortcuts for game keys
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
