
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, ShieldAlert, Cpu, Keyboard, ArrowRight } from 'lucide-react';
import { VimMode, Position, Level, Cell } from './types';
import { createBasicLevel, revealCells } from './utils/levelUtils';
import { useVimParser } from './hooks/useVimParser';

const CELL_SIZE = 30;

export default function Game() {
  const [level, setLevel] = useState<Level>(() => createBasicLevel('1'));
  const [playerPos, setPlayerPos] = useState<Position>(level.startPos);
  const [ghostPos, setGhostPos] = useState<Position>({ x: 0, y: 0 });
  const [mode, setMode] = useState<VimMode>(VimMode.NORMAL);
  const [isStarted, setIsStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [hasPlayerMoved, setHasPlayerMoved] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showHints, setShowHints] = useState(true);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [keyHistory, setKeyHistory] = useState<string[]>([]);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Simple Beep Sound Effect Utility
  const playWrongKeySound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(120, audioCtx.currentTime); // Low frequency buzz
      oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn('Audio context failed', e);
    }
  }, []);

  // Reveal logic
  useEffect(() => {
    setLevel(prev => {
      const nextGrid = revealCells(prev.grid, playerPos, 3);
      if (nextGrid === prev.grid) return prev;
      return { ...prev, grid: nextGrid };
    });
  }, [playerPos]);

  // Victory check (separate from setLevel to avoid side effects during state update)
  useEffect(() => {
    if (level.grid[playerPos.y] && level.grid[playerPos.y][playerPos.x]?.type === 'goal') {
      setIsVictory(true);
    }
  }, [playerPos, level.grid]);

  // Demo Playback Logic
  useEffect(() => {
    if (!isDemoRunning || !level.demoPath) return;

    if (demoStep >= level.demoPath.length) {
      setIsDemoRunning(false);
      return;
    }

    const interval = setTimeout(() => {
      const nextPos = level.demoPath![demoStep];
      const prevPos = demoStep > 0 ? level.demoPath![demoStep - 1] : level.startPos;
      
      // Determine key pressed for history
      let key = '';
      if (nextPos.x > prevPos.x) key = 'l';
      else if (nextPos.x < prevPos.x) key = 'h';
      else if (nextPos.y > prevPos.y) key = 'j';
      else if (nextPos.y < prevPos.y) key = 'k';

      if (key) {
        setKeyHistory(prev => [...prev.slice(-9), key]);
        setPressedKeys(new Set([key]));
        setTimeout(() => setPressedKeys(new Set()), 200);
      }

      setPlayerPos(nextPos);
      setDemoStep(prev => prev + 1);
    }, 400);

    return () => clearTimeout(interval);
  }, [isDemoRunning, demoStep, level.demoPath, level.startPos]);

  const handleMove = useCallback((delta: Position) => {
    if (isDemoRunning || isGameOver || isVictory) return;
    
    // Always start game if it hasn't been
    setIsStarted(true);

    setPlayerPos(prev => {
      const nextX = prev.x + delta.x;
      const nextY = prev.y + delta.y;

      const isWithinBounds = level.grid &&
        nextY >= 0 && nextY < level.grid.length &&
        nextX >= 0 && nextX < level.grid[0].length;

      const targetCell = isWithinBounds ? level.grid[nextY][nextX] : null;
      const isPath = targetCell && (targetCell.type === 'path' || targetCell.type === 'goal');

      if (isWithinBounds && isPath) {
        setHasPlayerMoved(true);
        return { x: nextX, y: nextY };
      } else {
        // Play sound if attempted move is invalid (blank space or wall)
        playWrongKeySound();
        return prev;
      }
    });
  }, [level.grid, isDemoRunning, isGameOver, isVictory, isStarted, playWrongKeySound]);

  // Consolidate key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDemoRunning || isGameOver || isVictory) return;
      
      const keyLower = e.key.toLowerCase();
      
      // Start game on any key press if not already started
      if (!isStarted && !['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
        setIsStarted(true);
      }

      // Filter valid keys
      const validVimKeys = ['h', 'j', 'k', 'l', 'i', 'v', ':', 'escape', 'w', 'b', 'e', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!validVimKeys.includes(keyLower) && !validVimKeys.includes(e.key)) return;

      // Update UI state
      setPressedKeys(prev => new Set(prev).add(keyLower));
      setKeyHistory(prev => [...prev.slice(-9), e.key === 'Escape' ? 'ESC' : e.key]);

      if (mode === VimMode.NORMAL) {
        if (['h', 'j', 'k', 'l', 'w', 'b', 'e', 'i', 'v', ':'].includes(keyLower)) {
          e.preventDefault();
        }

        switch (keyLower) {
          case 'h': handleMove({ x: -1, y: 0 }); break;
          case 'j': handleMove({ x: 0, y: 1 }); break;
          case 'k': handleMove({ x: 0, y: -1 }); break;
          case 'l': handleMove({ x: 1, y: 0 }); break;
          case 'i': setMode(VimMode.INSERT); break;
          case 'v': setMode(VimMode.VISUAL); break;
          case ':': setMode(VimMode.COMMAND); break;
          case 'escape': setMode(VimMode.NORMAL); break;
          // Support arrows too for accessibility
          case 'arrowleft': handleMove({ x: -1, y: 0 }); break;
          case 'arrowdown': handleMove({ x: 0, y: 1 }); break;
          case 'arrowup': handleMove({ x: 0, y: -1 }); break;
          case 'arrowright': handleMove({ x: 1, y: 0 }); break;
        }
      } else if (mode === VimMode.INSERT) {
        if (keyLower === 'escape') {
          e.preventDefault();
          setMode(VimMode.NORMAL);
        }
      } else if (mode === VimMode.COMMAND || mode === VimMode.VISUAL) {
        if (keyLower === 'escape') {
          e.preventDefault();
          setMode(VimMode.NORMAL);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isDemoRunning) return;
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isStarted, isGameOver, isVictory, isDemoRunning, mode, handleMove]);
  useEffect(() => {
    if (!isStarted || isGameOver || isVictory || isDemoRunning || !hasPlayerMoved) return;

    const interval = setInterval(() => {
      setGhostPos(prev => {
        let nextX = prev.x;
        let nextY = prev.y;

        if (Math.random() > 0.3) { // Ghost is more aggressive now
          if (prev.x < playerPos.x) nextX++;
          else if (prev.x > playerPos.x) nextX--;
          else if (prev.y < playerPos.y) nextY++;
          else if (prev.y > playerPos.y) nextY--;
        }

        if (nextX === playerPos.x && nextY === playerPos.y) {
          setIsGameOver(true);
        }

        return { x: nextX, y: nextY };
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isStarted, isGameOver, isVictory, playerPos]);

  // Moved handleMove above key listener

  const resetLevel = () => {
    const newLevel = createBasicLevel('1');
    setLevel(newLevel);
    setPlayerPos(newLevel.startPos);
    setGhostPos({ x: 0, y: 0 });
    setIsStarted(false);
    setHasPlayerMoved(false);
    setIsGameOver(false);
    setIsVictory(false);
    setAttempts(a => a + 1);
    setMode(VimMode.NORMAL);
    setDemoStep(0);
    setIsDemoRunning(false);
  };

  const startDemo = () => {
    resetLevel();
    setIsDemoRunning(true);
    setIsStarted(true);
  };

  // Removed useVimParser hook call to consolidate
  
  const visibleGrid = useMemo(() => {
    return level.grid;
  }, [level.grid]);

  // Camera centering
  const viewportCenter = {
    x: playerPos.x * CELL_SIZE - 400, // Assuming fixed stage width for calculation
    y: playerPos.y * CELL_SIZE - 250
  };

  return (
    <div className="relative w-full h-[600px] bg-[#0c0e12] text-slate-100 font-mono overflow-hidden select-none border-t border-slate-800">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-[#161b22]/80 backdrop-blur-md border-b border-slate-800 z-[150] flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold tracking-widest text-slate-400">LEVEL 1</span>
        </div>
        
        <div className="flex items-center gap-3 bg-[#0d1117] border border-slate-800 px-4 py-1 rounded">
          <span className="text-[10px] font-bold text-slate-500 uppercase">RHYTHM</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="w-4 h-4 border border-emerald-500/30 flex items-center justify-center">
                 <div className="w-2 h-2 bg-emerald-500/20" />
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm font-bold text-slate-400">
          [SCORE: <span className="text-emerald-400">00000</span>]
        </div>
      </div>

      {/* Background Subtle Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ 
             backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, 
             backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px` 
           }} />

      <motion.div 
        id="game-viewport"
        animate={{ 
          x: -Math.max(0, Math.min(level.width * CELL_SIZE - 800, viewportCenter.x)),
          y: -Math.max(0, Math.min(level.height * CELL_SIZE - 500, viewportCenter.y))
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 100 }}
        className="relative" // Removed pt-10 to fix coordinate alignment
        style={{ 
          width: level.width * CELL_SIZE,
          height: level.height * CELL_SIZE,
          marginTop: '40px' // Use margin instead of padding to shift grid WITHOUT shifting absolute origin
        }}
      >
        {visibleGrid.map((row, y) => (
          <div key={y} className="flex h-[30px]">
            {row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={`relative w-[30px] h-[30px] flex items-center justify-center text-sm transition-all duration-300
                  ${cell.type === 'path' ? 'border border-white/90 bg-[#0d1117] shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]' : ''}
                  ${cell.type === 'goal' ? 'bg-emerald-500/20 border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse' : ''}
                  ${!cell.isRevealed ? 'grayscale opacity-20' : 'opacity-100'}
                `}
              >
                {cell.type === 'goal' && (
                   <span className="font-bold text-emerald-400 tracking-widest text-lg drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">{cell.char}</span>
                )}
                {(cell.type === 'path' || (cell.type === 'goal' && !cell.char)) && (
                   <span className="font-bold text-white tracking-widest text-lg drop-shadow-sm">{cell.char}</span>
                )}
                
                {/* Floating HJKL markers based on context (simple logic for now) */}
                {cell.type === 'path' && x % 4 === 0 && y % 3 === 0 && !cell.char && (
                  <span className="text-[10px] text-emerald-500 font-bold font-mono opacity-40">j</span>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* The Ghost Cursor (Glitchy Red shadow) */}
        <motion.div
          animate={{ x: ghostPos.x * CELL_SIZE, y: ghostPos.y * CELL_SIZE }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.4 }}
          style={{ position: 'absolute', top: 0, left: 0 }}
          className="w-[30px] h-[30px] flex items-center justify-center border-2 border-red-500 bg-red-600/20 z-[200] shadow-[0_0_25px_rgba(239,68,68,0.4)] rounded-sm"
        >
          <div className="absolute inset-0 bg-red-500 opacity-20 animate-pulse" />
          <div className="text-[8px] font-black text-red-500 leading-none text-center drop-shadow-lg z-10">ERROR</div>
        </motion.div>

        {/* Player Cursor (Hero) */}
        <motion.div
          animate={{ x: playerPos.x * CELL_SIZE, y: playerPos.y * CELL_SIZE }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{ position: 'absolute', top: 0, left: 0 }}
          className={`w-[30px] h-[30px] flex items-center justify-center border-2 z-[210] rounded-sm transition-all
            ${mode === VimMode.NORMAL ? 'border-sky-400 bg-sky-500/20 shadow-[0_0_30px_rgba(56,189,248,0.6)]' : 
              mode === VimMode.INSERT ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(52,211,153,0.6)]' : 
              'border-purple-400 bg-purple-500/20 shadow-[0_0_30px_rgba(192,132,252,0.6)]'}
          `}
        >
          {/* Label Floating Above Player */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-emerald-400 tracking-widest drop-shadow-md">
            HJKL Hero
          </div>

          <div className="w-full h-full border border-white/20" />
          {/* Blinking block cursor */}
          <motion.div 
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className={`w-[20px] h-[20px] absolute z-20
              ${mode === VimMode.NORMAL ? 'bg-sky-400/40' : 'bg-emerald-400/40'}
            `} 
          />
        </motion.div>
      </motion.div>

      {/* Bottom Status Bar (Vim style) */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#161b22] border-t border-slate-800 z-[150] flex items-center justify-between px-6 text-xs overflow-hidden">
        <div className="flex items-center gap-4">
          <span className="text-slate-400 font-bold uppercase trekking-widest">[STATUS]: </span>
          <span className="text-emerald-400 animate-pulse">
            {isDemoRunning ? "Auto-Scrolling... Replicating movements!" : "Type h/j/k/l commands to navigate!"}
          </span>
        </div>
        
        <div className="flex items-center gap-4 h-full">
           <div className="h-full px-4 flex items-center bg-sky-500/10 border-l border-slate-800 text-sky-400 font-bold">
             [MODE: {mode}]
           </div>
           {/* Question Mark Help Icon */}
           <div className="bg-slate-800 h-10 w-10 flex items-center justify-center border-l border-slate-700 cursor-help group">
              <span className="text-xl font-bold group-hover:text-sky-400 transition-colors">?</span>
           </div>
        </div>
      </div>

      {/* Start Screen Overlay */}
      <AnimatePresence>
        {!isStarted && !isGameOver && !isVictory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[160] bg-[#0c0e12]/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full text-center">
               <div className="mb-8 flex justify-center">
                  <div className="w-16 h-16 border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center relative">
                     <div className="absolute inset-0 animate-ping bg-emerald-500/10" />
                     <span className="text-emerald-500 font-bold">VIM</span>
                  </div>
               </div>
               <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">RUNNER.SYS</h1>
               <p className="text-slate-500 text-sm mb-12 font-mono uppercase tracking-[0.2em]">Modal Navigation Training v1.0</p>
               
               <div className="grid grid-cols-2 gap-4 mb-12 text-left">
                  <div className="p-4 bg-[#161b22] border border-slate-800 rounded">
                     <span className="block text-[10px] text-slate-500 font-bold mb-1">MOTIONS</span>
                     <span className="text-xs text-slate-300">Use <kbd className="text-emerald-400">h j k l</kbd> to move your cursor through the words.</span>
                  </div>
                  <div className="p-4 bg-[#161b22] border border-slate-800 rounded">
                     <span className="block text-[10px] text-slate-500 font-bold mb-1">GOAL</span>
                     <span className="text-xs text-slate-300">Reach the <kbd className="text-emerald-400">FINISH</kbd> block before the shadow catches you.</span>
                  </div>
               </div>

               <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => setIsStarted(true)}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#0c0e12] font-black text-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95"
                  >
                    INITIALIZE_SESSION()
                  </button>
                  <button 
                    onClick={startDemo}
                    className="w-full py-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    -- RUN_DEMO.MOD --
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over / Victory */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[170] bg-red-950/20 backdrop-blur-lg flex items-center justify-center p-6 text-center"
          >
            <div className="max-w-md w-full bg-[#161b22] border-2 border-red-500 p-12 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
              <ShieldAlert size={48} className="mx-auto text-red-500 mb-6" />
              <h1 className="text-3xl font-black text-white mb-2 leading-tight uppercase italic tracking-tighter">SEGMENTATION FAULT</h1>
              <p className="text-red-400/60 text-sm mb-12 font-mono">
                Memory was corrupted by the Ghost Process. Positioning is survival.
              </p>
              <button 
                onClick={resetLevel}
                className="w-full py-4 bg-red-500 hover:bg-red-400 text-white font-bold text-lg transition-all"
              >
                REBOOT_LEVEL()
              </button>
            </div>
          </motion.div>
        )}

        {isVictory && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-[170] bg-[#0c0e12]/90 backdrop-blur-xl flex items-center justify-center p-6 text-center"
          >
            <div className="max-w-md w-full bg-[#161b22] border-2 border-emerald-500 p-12 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <Cpu size={48} className="mx-auto text-emerald-400 mb-6" />
              <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">SEQUENCE COMPLETE</h1>
              <p className="text-emerald-400/60 text-sm mb-12 uppercase tracking-widest font-mono">
                Your motions were optimal.
              </p>
              <button 
                onClick={resetLevel}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#0c0e12] font-black text-xl transition-all"
              >
                CONTINUE_TO_LEVEL_2()
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
