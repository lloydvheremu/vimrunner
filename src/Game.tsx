
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
  const [attempts, setAttempts] = useState(0);
  const [showHints, setShowHints] = useState(true);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [keyHistory, setKeyHistory] = useState<string[]>([]);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Reveal logic & Victory check
  useEffect(() => {
    setLevel(prev => {
      const nextGrid = revealCells(prev.grid, playerPos, 3);
      
      if (nextGrid[playerPos.y][playerPos.x].type === 'goal') {
        setIsVictory(true);
      }
      
      if (nextGrid === prev.grid) return prev;
      return { ...prev, grid: nextGrid };
    });
  }, [playerPos]);

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

  // Global key listener for history and visual keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isDemoRunning) return;
      setPressedKeys(prev => new Set(prev).add(e.key.toLowerCase()));
      setKeyHistory(prev => [...prev.slice(-9), e.key]);
    };
    const up = (e: KeyboardEvent) => {
      if (isDemoRunning) return;
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [isDemoRunning]);
  useEffect(() => {
    if (!isStarted || isGameOver || isVictory || isDemoRunning) return;

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

  const handleMove = useCallback((delta: Position) => {
    if (isDemoRunning) return;
    if (!isStarted) setIsStarted(true);
    setPlayerPos(prev => {
      const nextX = prev.x + delta.x;
      const nextY = prev.y + delta.y;

      if (
        nextY >= 0 && nextY < level.grid.length &&
        nextX >= 0 && nextX < level.grid[0].length &&
        level.grid[nextY][nextX].type !== 'wall'
      ) {
        return { x: nextX, y: nextY };
      }
      return prev;
    });
  }, [level.grid, isStarted]);

  const resetLevel = () => {
    const newLevel = createBasicLevel('1');
    setLevel(newLevel);
    setPlayerPos(newLevel.startPos);
    setGhostPos({ x: 0, y: 0 });
    setIsStarted(false);
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

  useVimParser(
    mode,
    handleMove,
    setMode,
    () => { if (!isStarted) setIsStarted(true); }
  );

  const visibleGrid = useMemo(() => {
    return level.grid;
  }, [level.grid]);

  // Camera centering
  const viewportCenter = {
    x: playerPos.x * CELL_SIZE - 400, // Assuming fixed stage width for calculation
    y: playerPos.y * CELL_SIZE - 250
  };

  return (
    <div className="relative w-full h-[600px] bg-slate-950 text-slate-100 font-mono overflow-hidden select-none border-4 border-slate-900 rounded-2xl shadow-2xl">
      {/* Background Grid Decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`, backgroundSize: '40px 40px' }} />

      {/* Main Game Stage - Scrolling to center player */}
      <motion.div 
        animate={{ 
          x: -Math.max(0, Math.min(level.width * CELL_SIZE - 800, viewportCenter.x)),
          y: -Math.max(0, Math.min(level.height * CELL_SIZE - 500, viewportCenter.y))
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 100 }}
        className="relative"
        style={{ 
          width: level.width * CELL_SIZE,
          height: level.height * CELL_SIZE 
        }}
      >
        {visibleGrid.map((row, y) => (
          <div key={y} className="flex h-[30px]">
            {row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={`relative w-[30px] h-[30px] flex items-center justify-center text-sm
                  ${cell.isRevealed ? 'opacity-100' : 'opacity-0 scale-90 blur-sm'}
                  transition-all duration-500
                `}
                style={{ transitionDelay: `${Math.random() * 200}ms` }}
              >
                {cell.type === 'path' && <span className="text-slate-400 opacity-30">.</span>}
                {cell.type === 'wall' && <span className="text-emerald-500 font-bold opacity-60">#</span>}
                {cell.type === 'goal' && <ArrowRight className="text-emerald-400 animate-bounce" size={16} />}
                <span className="relative z-10">{cell.char !== ' ' ? cell.char : ''}</span>
              </div>
            ))}
          </div>
        ))}

        {/* The Ghost Cursor (Chaser) */}
        <motion.div
          animate={{ x: ghostPos.x * CELL_SIZE, y: ghostPos.y * CELL_SIZE }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.4 }}
          className="absolute w-[30px] h-[30px] flex items-center justify-center border-2 border-red-500 bg-red-500/20 z-40"
        >
          <div className="w-full h-full absolute animate-ping bg-red-500/20" />
          <div className="text-[10px] font-bold text-red-500 leading-none text-center">GHOST</div>
        </motion.div>

        {/* Player Cursor */}
        <motion.div
          animate={{ x: playerPos.x * CELL_SIZE, y: playerPos.y * CELL_SIZE }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`absolute w-[30px] h-[30px] flex items-center justify-center border-2 z-50
            ${mode === VimMode.NORMAL ? 'border-sky-400 bg-sky-400/20' : 
              mode === VimMode.INSERT ? 'border-emerald-400 bg-emerald-400/20' : 
              'border-purple-400 bg-purple-400/20'}
          `}
        >
          <div className="w-1 h-3 bg-current animate-pulse" />
        </motion.div>
      </motion.div>

      {/* Start Screen Overlay */}
      <AnimatePresence>
        {!isStarted && !isGameOver && !isVictory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-lg text-center">
              <div className="flex justify-center gap-12 mb-8">
                <div className="flex flex-col items-center">
                   <div className="w-12 h-12 border-4 border-sky-400 bg-sky-400/20 flex items-center justify-center mb-2">
                     <div className="w-2 h-4 bg-sky-400 animate-pulse" />
                   </div>
                   <span className="text-sky-400 font-bold text-sm">YOU (CURSOR)</span>
                   <span className="text-[10px] text-slate-500">h, j, k, l to move</span>
                </div>
                <div className="flex flex-col items-center">
                   <div className="w-12 h-12 border-4 border-red-500 bg-red-500/20 flex items-center justify-center mb-2 relative">
                     <div className="absolute inset-0 animate-ping bg-red-400/20" />
                     <span className="text-[10px] text-red-500 font-bold">GHOST</span>
                   </div>
                   <span className="text-red-500 font-bold text-sm">THE GHOST</span>
                   <span className="text-[10px] text-slate-500">Chases you</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">READY TO ENTER THE MAZE?</h1>
              <p className="text-slate-400 mb-8 leading-relaxed">
                The Ghost of Vim Past is fast. Use your motions to navigate and reveal the path. 
                Don't let him catch your tail.
              </p>
              <div className="flex items-center justify-center gap-4 text-slate-500 animate-bounce">
                <Keyboard size={20} />
                <span className="font-bold tracking-widest text-sm text-sky-400/80">PRESS ANY KEY TO START</span>
              </div>
              <div className="mt-6 flex gap-4 justify-center">
                <button 
                  onClick={startDemo}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg border border-slate-700 transition-colors text-sm font-bold flex items-center gap-2"
                >
                  <ArrowRight size={16} />
                  WATCH DEMO WALKTHROUGH
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Keyboard & Key History Overlay */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-none">
        {/* Key History */}
        <div className="flex gap-2">
          {keyHistory.map((k, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-8 h-8 bg-slate-900 border border-slate-700 rounded flex items-center justify-center text-xs font-bold text-slate-400"
            >
              {k}
            </motion.div>
          ))}
        </div>

        {/* Visual Keyboard (HJKL + Essentials Focus) */}
        <div className="bg-slate-900/80 p-2 rounded-xl backdrop-blur-sm border border-slate-800 flex gap-2">
           {['h', 'j', 'k', 'l', 'i', 'escape'].map((k) => (
             <div
               key={k}
               className={`w-10 h-10 rounded-lg border-2 flex flex-col items-center justify-center transition-all
                 ${pressedKeys.has(k) 
                   ? 'bg-sky-500 border-sky-400 text-white scale-95 shadow-[0_0_15px_rgba(56,189,248,0.5)]' 
                   : 'bg-slate-800 border-slate-700 text-slate-500'}
                 ${k === 'escape' ? 'w-16' : ''}
               `}
             >
               <span className={`font-bold uppercase ${k === 'escape' ? 'text-[8px]' : 'text-xs'}`}>
                 {k === 'escape' ? 'ESC' : k}
               </span>
               <span className="text-[8px] opacity-60">
                 {k === 'h' ? '←' : k === 'j' ? '↓' : k === 'k' ? '↑' : k === 'l' ? '→' : k === 'i' ? 'INS' : 'NORM'}
               </span>
             </div>
           ))}
        </div>
      </div>

      {/* UI Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
        {/* Mode & Status */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-lg">
            <div className={`w-3 h-3 rounded-full animate-pulse ${mode === VimMode.NORMAL ? 'bg-sky-400' : 'bg-emerald-400'}`} />
            <span className="font-bold text-lg tracking-widest">-- {mode} --</span>
          </div>
          <div className="text-xs text-slate-500 bg-slate-900/40 px-3 py-1 rounded">
            LEVEL: {level.title} | POS: {playerPos.x}, {playerPos.y}
          </div>
        </div>

        {/* Hints */}
        <AnimatePresence>
          {showHints && !isGameOver && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-slate-900/90 border border-sky-900/50 p-4 rounded-xl shadow-2xl max-w-sm pointer-events-auto"
            >
              <div className="flex items-center gap-2 text-sky-400 mb-2 font-bold">
                <Cpu size={16} />
                <span>SYSTEM HINT</span>
              </div>
              <p className="text-sm text-slate-300 italic">
                {attempts === 0 ? level.description : level.hints[attempts % level.hints.length]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Start Screen / Game Over / Victory */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 text-center"
          >
            <div className="max-w-md">
              <ShieldAlert size={64} className="mx-auto text-red-500 mb-6" />
              <h1 className="text-4xl font-bold text-white mb-2 leading-tight">CAUGHT BY THE GHOST</h1>
              <p className="text-slate-400 mb-8">
                The Ghost of Vim Past caught up to you. In Vim, speed is efficiency, but positioning is life.
              </p>
              <button 
                onClick={resetLevel}
                className="group flex items-center justify-center gap-3 w-full py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-xl transition-all font-bold text-xl pointer-events-auto overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                <ArrowRight />
                RETRY LEVEL
              </button>
            </div>
          </motion.div>
        )}

        {isVictory && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-[100] bg-emerald-950/90 backdrop-blur-xl flex items-center justify-center p-6 text-center"
          >
            <div className="max-w-md">
              <Cpu size={64} className="mx-auto text-emerald-400 mb-6" />
              <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
                {isDemoRunning ? "DEMO COMPLETE" : "LEVEL MASTERED"}
              </h1>
              <p className="text-emerald-100/60 mb-8">
                {isDemoRunning 
                  ? "The path is clear. Now it's your turn to replicate the motions." 
                  : "Your cursor moved with precision. The text maze has been cleared. Next concept awaits..."}
              </p>
              <button 
                onClick={resetLevel}
                className="group flex items-center justify-center gap-3 w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all font-bold text-xl pointer-events-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                <ArrowRight />
                {isDemoRunning ? "START LEVEL" : "CONTINUE TO OPERATORS"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Legend */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-60">
        <div className="flex items-center gap-2 text-xs">
          <kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700">h,j,k,l</kbd>
          <span>Move</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700">ESC</kbd>
          <span>Normal Mode</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700">i</kbd>
          <span>Insert Mode</span>
        </div>
      </div>
    </div>
  );
}
