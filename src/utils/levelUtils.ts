
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

  // Rule of Thumb: Each hub provides a "Forward" path and a "Decoy" path.
  // We prioritize clear, non-conflicting intersections.

  // MAIN BOOTSTRAP:
  // 1. START (H): (10,10)S (11,10)T (12,10)A (13,10)R (14,10)T
  placeWord(10, 10, "START", 'h');
  
  // 2. THROUGH (V): (14,10)T (14,11)H (14,12)R (14,13)O (14,14)U (14,15)G (14,16)H
  placeWord(14, 10, "THROUGH", 'v');

  // 3. HELPER (H): (14,16)H (15,16)E (16,16)L (17,16)P (18,16)E (19,16)R
  placeWord(14, 16, "HELPER", 'h');

  // 4. RESULTS (V): (19,16)R (19,17)E (19,18)S (19,19)U (19,20)L (19,21)T (19,22)S
  placeWord(19, 16, "RESULTS", 'v');

  // 5. FINISH (H): (19,22)F (20,22)I (21,22)N (22,22)I (23,22)S (24,22)H
  placeWord(19, 22, "FINISH", 'h');

  // DECOYS (Attractive dead ends):
  // D1: From 'A' in START (12,10) -> Up ('k')
  placeWord(12, 7, "AREA", 'v');  // (12,7)A (12,8)R (12,9)E (12,10)A -> Intersects START[2] 'A' at 12,10.
  placeWord(9, 7, "SAFE", 'h');   // (9,7)S (10,7)A (11,7)F (12,7)E -> End of AREA.

  // D2: From 'R' in THROUGH (14,12) -> Right ('l')
  placeWord(14, 12, "RIGHT", 'h'); // (14,12)R (15,12)I (16,12)G (17,12)H (18,12)T
  placeWord(18, 12, "TRAP", 'v');  // (18,12)T (18,13)R (18,14)A (18,15)P

  // D3: From 'P' in HELPER (17,16) -> Up ('k')
  placeWord(17, 13, "PATH", 'v');  // (17,13)P (17,14)A (17,15)T (17,16)H

  // Goal: Final char of FINISH (24,22)
  grid[22][24] = { char: '★', isRevealed: false, type: 'goal' };

  return {
    id,
    title: "Vim Runner",
    description: "Master hjkl to find the ★. Watch out for attractive dead ends!",
    width,
    height,
    startPos: { x: 10, y: 10 },
    goalPos: { x: 24, y: 22 },
    grid,
    scrollingVector: { x: 0, y: 0 },
    scrollSpeed: 0,
    hints: [
      "Use h, j, k, l to move your cursor.",
      "Follow the words to find the goal."
    ],
    demoPath: [
      {x: 4, y: 4}, {x: 5, y: 4}, {x: 6, y: 4},
      {x: 6, y: 5}, {x: 6, y: 6}, {x: 6, y: 7}, {x: 6, y: 8}, {x: 6, y: 9}, {x: 6, y: 10},
      {x: 7, y: 10}, {x: 8, y: 10}, {x: 9, y: 10}, {x: 10, y: 10}
    ]
  };
}

export function revealCells(grid: Cell[][], pos: Position, radius: number = 2): Cell[][] {
  let changed = false;
  // Check if any cell in the radius needs revealing
  for (let y = Math.max(0, pos.y - radius); y <= Math.min(grid.length - 1, pos.y + radius); y++) {
    for (let x = Math.max(0, pos.x - radius); x <= Math.min(grid[0].length - 1, pos.x + radius); x++) {
      if (!grid[y][x].isRevealed) {
        changed = true;
        break;
      }
    }
    if (changed) break;
  }

  if (!changed) return grid;

  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  for (let y = Math.max(0, pos.y - radius); y <= Math.min(grid.length - 1, pos.y + radius); y++) {
    for (let x = Math.max(0, pos.x - radius); x <= Math.min(grid[0].length - 1, pos.x + radius); x++) {
      newGrid[y][x].isRevealed = true;
    }
  }
  return newGrid;
}
