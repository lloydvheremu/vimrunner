
import { Cell, Level, Position } from '../types';

export function createBasicLevel(id: string): Level {
  const width = 60;
  const height = 30;
  const grid: Cell[][] = [];

  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = {
        char: ' ',
        isRevealed: false,
        type: 'empty'
      };
    }
  }

  // Helper to place a word
  const placeWord = (x: number, y: number, word: string, direction: 'h' | 'v') => {
    for (let i = 0; i < word.length; i++) {
      const curX = direction === 'h' ? x + i : x;
      const curY = direction === 'v' ? y + i : y;
      if (grid[curY] && grid[curY][curX]) {
        grid[curY][curX] = {
          char: word[i].toUpperCase(),
          isRevealed: false,
          type: 'path'
        };
      }
    }
  };

  // A strictly connected crossword maze
  // Intersection characters are the primary way to move between words.
  
  // Hub 1: START (Horizontal)
  // (10,10)S (11,10)T (12,10)A (13,10)R (14,10)T
  placeWord(10, 10, "START", 'h');

  // DECOY: TRAP (Vertical) from last 'T' of START
  // (14,10)T (14,11)R (14,12)A (14,13)P
  placeWord(14, 10, "TRAP", 'v');

  // Hub 2: ARCADE (Vertical) from 'A' of START (12,10)
  // (12,10)A (12,11)R (12,12)C (12,13)A (12,14)D (12,15)E
  placeWord(12, 10, "ARCADE", 'v');

  // Hub 3: ALWAYS (Horizontal) from second 'A' of ARCADE (12,13)
  // (12,13)A (13,13)L (14,13)W (15,13)A (16,13)Y (17,13)S
  placeWord(12, 13, "ALWAYS", 'h');

  // DECOY: LOST (Vertical) from 'L' of ALWAYS (13,13)
  // (13,13)L (13,14)O (13,15)S (13,16)T
  placeWord(13, 13, "LOST", 'v');

  // Hub 4: YELL (Vertical) from 'Y' of ALWAYS (16,13)
  // (16,13)Y (16,14)E (16,15)L (16,16)L
  placeWord(16, 13, "YELL", 'v');

  // Hub 5: LOCK (Horizontal) from second 'L' of YELL (16,16)
  // (16,16)L (17,16)O (18,16)C (19,16)K
  placeWord(16, 16, "LOCK", 'h');

  // Hub 6: KEYS (Vertical) from 'K' of LOCK (19,16)
  // (19,16)K (19,17)E (19,18)Y (19,19)S
  placeWord(19, 16, "KEYS", 'v');

  // Hub 7: SUCCESS (Horizontal) from 'S' of KEYS (19,19)
  // (19,19)S (20,19)U (21,19)C (22,19)C (23,19)E (24,19)S (25,19)S
  placeWord(19, 19, "SUCCESS", 'h');

  // Goal state: The final character of SUCCESS (25,19)
  grid[19][25] = { char: '★', isRevealed: false, type: 'goal' };

  return {
    id,
    title: "Vim Runner",
    description: "Master hjkl to find the ★. Watch out for attractive dead ends!",
    width,
    height,
    startPos: { x: 10, y: 10 },
    goalPos: { x: 25, y: 19 },
    grid,
    scrollingVector: { x: 0, y: 0 },
    scrollSpeed: 0,
    hints: [
      "Use h, j, k, l to move your cursor.",
      "Follow the words to find the goal."
    ],
    demoPath: [
      {x: 10, y: 10}, {x: 11, y: 10}, {x: 12, y: 10},
      {x: 12, y: 11}, {x: 12, y: 12}, {x: 12, y: 13},
      {x: 13, y: 13}, {x: 14, y: 13}, {x: 15, y: 13}, {x: 16, y: 13},
      {x: 16, y: 14}, {x: 16, y: 15}, {x: 16, y: 16},
      {x: 17, y: 16}, {x: 18, y: 16}, {x: 19, y: 16},
      {x: 19, y: 17}, {x: 19, y: 18}, {x: 19, y: 19},
      {x: 20, y: 19}, {x: 21, y: 19}, {x: 22, y: 19}, {x: 23, y: 19}, {x: 24, y: 19}, {x: 25, y: 19}
    ]
  };
}

export function revealCells(grid: Cell[][], pos: Position): Cell[][] {
  const { x, y } = pos;
  if (!grid[y] || !grid[y][x]) return grid;

  // Check if anything actually needs to be revealed
  // We'll just do a reveal and check if different later for efficiency
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  
  // 1. Reveal horizontal chain (up to 3 units)
  for (let i = 0; i <= 3; i++) {
    const cx = x - i;
    if (cx >= 0 && grid[y][cx].type !== 'empty') {
      newGrid[y][cx].isRevealed = true;
    } else {
      break;
    }
  }
  for (let i = 1; i <= 3; i++) {
    const cx = x + i;
    if (cx < grid[0].length && grid[y][cx].type !== 'empty') {
      newGrid[y][cx].isRevealed = true;
    } else {
      break;
    }
  }

  // 2. Reveal vertical chain (up to 3 units)
  for (let i = 0; i <= 3; i++) {
    const cy = y - i;
    if (cy >= 0 && grid[cy][x].type !== 'empty') {
      newGrid[cy][x].isRevealed = true;
    } else {
      break;
    }
  }
  for (let i = 1; i <= 3; i++) {
    const cy = y + i;
    if (cy < grid.length && grid[cy][x].type !== 'empty') {
      newGrid[cy][x].isRevealed = true;
    } else {
      break;
    }
  }

  // 3. Failsafe: reveal the cell itself
  newGrid[y][x].isRevealed = true;

  // Small optimization: check if anything actually changed
  let changed = false;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c].isRevealed !== newGrid[r][c].isRevealed) {
        changed = true;
        break;
      }
    }
    if (changed) break;
  }

  return changed ? newGrid : grid;
}
