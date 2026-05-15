
import { Cell, Level, Position } from '../types';

export function createBasicLevel(id: string): Level {
  const width = 40;
  const height = 20;
  const grid: Cell[][] = [];

  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      // Basic wall generation: edges are walls
      const isEdge = x === 0 || x === width - 1 || y === 0 || y === height - 1;
      grid[y][x] = {
        char: isEdge ? '#' : ' ',
        isRevealed: false,
        type: isEdge ? 'wall' : 'path'
      };
    }
  }

  // Add some simple text paths for Level 1 (h,j,k,l)
  const pathText = "h j k l   m o v e m e n t";
  for (let i = 0; i < pathText.length; i++) {
    if (grid[5] && grid[5][5 + i]) {
      grid[5][5 + i] = {
        char: pathText[i],
        isRevealed: false,
        type: 'path'
      };
    }
  }

  // Add obstacles (walls) to navigate around
  for (let i = 2; i < 15; i++) {
    grid[i][15] = { char: '|', isRevealed: false, type: 'wall' };
  }

  // Clear paths and add a goal
  grid[15][35] = { char: 'G', isRevealed: false, type: 'goal' };

  // Add paths through the fog
  const paths = [
    { x: 2, y: 2, text: "START" },
    { x: 5, y: 5, text: "NAVIGATE" },
    { x: 10, y: 2, text: "DEAD END" }, // Upward branch
    { x: 10, y: 8, text: "DOWN" },
    { x: 10, y: 12, text: "CROSSWORD" },
    { x: 20, y: 12, text: "PUZZLE" },
    { x: 3, y: 10, text: "WRONG WAY" }, // Left branch
    { x: 25, y: 15, text: "ALMOST" },
    { x: 30, y: 15, text: "FINISH" },
    { x: 20, y: 5, text: "TRAP" }
  ];

  paths.forEach(p => {
    for (let i = 0; i < p.text.length; i++) {
        const py = p.y;
        const px = p.x + i;
        if (grid[py] && grid[py][px]) {
            grid[py][px] = { char: p.text[i], isRevealed: false, type: 'path' };
        }
    }
  });

  // Connecting passages
  const connectors = [
    { x1: 7, x2: 10, y: 5 }, // Connect NAVIGATE to DOWN/DEAD END
    { x1: 10, y1: 5, y2: 8 }, // Vertical connector
    { x1: 14, y1: 8, y2: 12 }, // Connect DOWN to CROSSWORD
    { x1: 29, x2: 30, y: 12 }, // Gap connector
    { x1: 20, y1: 12, y2: 15 }, // Puzzle to ALMOST
  ];

  connectors.forEach(c => {
    if ('x' in c) { // Vertical
        const vertical = c as {x1: number, y1: number, y2: number};
        for(let y = vertical.y1; y <= vertical.y2; y++) {
            if(grid[y] && grid[y][vertical.x1]) grid[y][vertical.x1] = { char: ' ', isRevealed: false, type: 'path' };
        }
    } else { // Horizontal
        const horizontal = c as {x1: number, x2: number, y: number};
        for(let x = horizontal.x1; x <= horizontal.x2; x++) {
            if(grid[horizontal.y] && grid[horizontal.y][x]) grid[horizontal.y][x] = { char: ' ', isRevealed: false, type: 'path' };
        }
    }
  });

  return {
    id,
    title: "The Modal Maze",
    description: "Navigate the smoking text maze. Stay ahead of the Critical Boundary.",
    width,
    height,
    startPos: { x: 2, y: 2 },
    goalPos: { x: 35, y: 15 },
    grid,
    scrollingVector: { x: 0.12, y: 0 }, // Slightly faster pressure
    scrollSpeed: 0.5,
    hints: [
      "Movement: h (left), j (down), k (up), l (right).",
      "The fog reveals itself as you move.",
      "The Red Boundary will consume you if you hesitate."
    ],
    demoPath: [
      {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 2}, {x: 5, y: 2},
      {x: 5, y: 3}, {x: 5, y: 4}, {x: 5, y: 5},
      {x: 6, y: 5}, {x: 7, y: 5}, {x: 8, y: 5}, {x: 9, y: 5}, {x: 10, y: 5},
      {x: 10, y: 6}, {x: 10, y: 7}, {x: 10, y: 8},
      {x: 11, y: 8}, {x: 12, y: 8}, {x: 13, y: 8}, {x: 14, y: 8},
      {x: 14, y: 9}, {x: 14, y: 10}, {x: 14, y: 11}, {x: 14, y: 12},
      {x: 15, y: 12}, {x: 16, y: 12}, {x: 17, y: 12}, {x: 18, y: 12}, {x: 19, y: 12}, {x: 20, y: 12},
      {x: 21, y: 12}, {x: 22, y: 12}, {x: 23, y: 12}, {x: 24, y: 12}, {x: 25, y: 12}, {x: 26, y: 12}, {x: 27, y: 12}, {x: 28, y: 12}, {x: 29, y: 12}, {x: 30, y: 12},
      {x: 30, y: 13}, {x: 30, y: 14}, {x: 30, y: 15},
      {x: 31, y: 15}, {x: 32, y: 15}, {x: 33, y: 15}, {x: 34, y: 15}, {x: 35, y: 15}
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
