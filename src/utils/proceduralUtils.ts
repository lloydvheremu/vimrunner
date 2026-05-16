
import { Cell, Level, Position } from '../types';

const DICTIONARY = [
  "VIM", "MODE", "EDIT", "QUIT", "SAVE", "UNDO", "COPY", "PASTE", 
  "SEARCH", "REPLACE", "NORMAL", "INSERT", "VISUAL", "MOTION", 
  "BUFFER", "WINDOW", "PLUGIN", "CONFIG", "SCRIPT", "MACRO", 
  "JUMP", "MARK", "FOLD", "WRAP", "SHELL", "TERMINAL", "GHOST", 
  "RUNNER", "CHALLENGE", "VICTORY", "SUCCESS", "SOURCE", "CODE",
  "BINARY", "SYSTEM", "KERNEL", "INPUT", "OUTPUT", "MEMORY", 
  "POINTER", "STATED", "FLUX", "FLOW", "CYCLE", "SYNC", "TASK"
];

function getRandomWord(exclude: string[] = []): string {
  const available = DICTIONARY.filter(w => !exclude.includes(w));
  return available[Math.floor(Math.random() * available.length)] || "VIM";
}

/**
 * Procedural level generator using a dictionary-based branching algorithm.
 * 
 * Think of this as a "Reverse Crossword Solver":
 * Instead of filling a grid based on clues, we pick a word, then find a random character
 * in that word to sprout a NEW word perpendicularly, ensuring they intersect correctly.
 * 
 * @param id Level identifier
 * @param seed Random seed string
 * @returns A fully generated Level object
 */
export function generateProceduralLevel(id: string, seed: string): Level {
  const width = 60;
  const height = 30;
  
  // Padding for the "Fixed Shape Outline" (A Tidy Rectangle)
  // This ensures the maze doesn't hug the very edges of the terminal window,
  // keeping the design clean and intentional.
  const PADDING_X = 5;
  const PADDING_Y = 3;
  const INNER_WIDTH = width - PADDING_X * 2;
  const INNER_HEIGHT = height - PADDING_Y * 2;

  let finalLevel: Level | null = null;
  let generationAttempts = 0;

  // We use a "Retry Loop" (Iteration) instead of Recursion to avoid 
  // "Maximum call stack size exceeded" errors.
  // This is like a chef trying 50 different plating arrangements until one is perfect,
  // rather than a chef calling themselves recursively to plate.
  while (!finalLevel && generationAttempts < 50) {
    generationAttempts++;
    const grid: Cell[][] = [];
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        grid[y][x] = { char: ' ', isRevealed: false, type: 'empty' };
      }
    }

    // QUADRANT LOGIC (Guaranteed Distance)
    // We divide the grid into 4 corners (Quadrants).
    // If the START is in the Top-Left (Q0), we force the TARGET to be in the 
    // Bottom-Right (Q3). This prevents the "Level 1 is too short" problem.
    const startQ = Math.floor(Math.random() * 4);
    const startX = startQ % 2 === 0 ? PADDING_X + 2 : width - PADDING_X - 5;
    const startY = startQ < 2 ? PADDING_Y + 2 : height - PADDING_Y - 5;
    const targetQ = 3 - startQ;

    const placedWords: { word: string; x: number; y: number; dir: 'h' | 'v'; depth: number }[] = [];

    /**
     * Collision detection for word placement.
     * Imagine laying a physical tile: we check if the floor is clear and if the 
     * edges touch any other tiles we didn't intend to connect with.
     */
    const canPlaceWord = (x: number, y: number, word: string, dir: 'h' | 'v', intersectionIdx: number): boolean => {
      const worldX = dir === 'h' ? x - intersectionIdx : x;
      const worldY = dir === 'v' ? y - intersectionIdx : y;

      // BOUNDING BOX CONSTRAINT: Keep words inside the "Square/Rectangle" outline
      if (worldX < PADDING_X || worldY < PADDING_Y || 
          (dir === 'h' && worldX + word.length >= width - PADDING_X) || 
          (dir === 'v' && worldY + word.length >= height - PADDING_Y)) {
        return false;
      }

      for (let i = 0; i < word.length; i++) {
          const curX = dir === 'h' ? worldX + i : worldX;
          const curY = dir === 'v' ? worldY + i : worldY;
          
          if (i !== intersectionIdx) {
              // Only check 4-neighbors (cardinal) to allow more compact layouts
              const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
              for (const [dx, dy] of neighbors) {
                  const nx = curX + dx;
                  const ny = curY + dy;
                  // If we find a path cell that is NOT the intersection point, it's a collision
                  if (grid[ny]?.[nx]?.type === 'path' && !(nx === x && ny === y)) return false;
              }
              if (grid[curY][curX].type === 'path') return false;
          } else {
              if (grid[curY][curX].char !== word[i].toUpperCase()) return false;
          }
      }
      return true;
    };

    const placeWord = (x: number, y: number, word: string, dir: 'h' | 'v', intersectionIdx: number, depth: number) => {
      const worldX = dir === 'h' ? x - intersectionIdx : x;
      const worldY = dir === 'v' ? y - intersectionIdx : y;

      for (let i = 0; i < word.length; i++) {
        const curX = dir === 'h' ? worldX + i : worldX;
        const curY = dir === 'v' ? worldY + i : worldY;
        grid[curY][curX] = {
          char: word[i].toUpperCase(),
          isRevealed: false,
          type: 'path'
        };
      }
      placedWords.push({ word, x: worldX, y: worldY, dir, depth });
    };

    // Initial word placement to seed the growth loop.
    // This is the first "root" of our vine.
    placeWord(startX, startY, "START", 'h', 0, 0);

    // THE GROWTH LOOP
    // We continue sprouting new branches until we reach our target density.
    // Analogy: Planting a vine. The first word is the root, and each new word 
    // is a sprout growing off an existing leaf.
    const targetWords = 20; 
    let growthAttempts = 0;
    while (placedWords.length < targetWords && growthAttempts < 600) {
      growthAttempts++;
      // Pick a random word from the trellis to sprout from
      const parentIdx = Math.floor(Math.random() * placedWords.length);
      
      const parent = placedWords[parentIdx];
      const newDir = parent.dir === 'h' ? 'v' : 'h';
      const charIdx = Math.floor(Math.random() * parent.word.length);
      const intX = parent.dir === 'h' ? parent.x + charIdx : parent.x;
      const intY = parent.dir === 'v' ? parent.y + charIdx : parent.y;
      const intersectionChar = parent.word[charIdx].toUpperCase();

      const candidateWord = getRandomWord(placedWords.map(w => w.word));
      const charInCandidateIdx = candidateWord.toUpperCase().indexOf(intersectionChar);

      if (charInCandidateIdx !== -1) {
        if (canPlaceWord(intX, intY, candidateWord, newDir, charInCandidateIdx)) {
          placeWord(intX, intY, candidateWord, newDir, charInCandidateIdx, parent.depth + 1);
        }
      }
    }

    // Filter goal candidates - any word that makes it far enough
    const candidates = placedWords
      .map(w => ({
        x: w.dir === 'h' ? w.x + w.word.length - 1 : w.x,
        y: w.dir === 'v' ? w.y + w.word.length - 1 : w.y,
        depth: w.depth
      }))
      .filter(pos => {
        // Sector bias: ideally in the target quadrant
        const inTargetX = pos.x < width / 2 ? (targetQ % 2 === 0) : (targetQ % 2 !== 0);
        const inTargetY = pos.y < height / 2 ? (targetQ < 2) : (targetQ >= 2);
        return inTargetX && inTargetY;
      });

    // If no candidates in diagonal quadrant, try any far-ish point
    const allCandidates = placedWords.map(w => ({
      x: w.dir === 'h' ? w.x + w.word.length - 1 : w.x,
      y: w.dir === 'v' ? w.y + w.word.length - 1 : w.y,
      depth: w.depth
    }));

    const finalCandidates = candidates.length > 0 ? candidates : allCandidates;

    if (finalCandidates.length > 0) {
      finalCandidates.sort((a, b) => b.depth - a.depth);
      const goal = finalCandidates[0];

      const dist = Math.abs(goal.x - startX) + Math.abs(goal.y - startY);
      const minThreshold = (width + height) * (0.35 - (generationAttempts * 0.005)); 

      if (dist >= minThreshold || generationAttempts > 45) {
        grid[goal.y][goal.x] = { char: '★', isRevealed: false, type: 'goal' };
        finalLevel = {
          id,
          title: "Vim Runner (Procedural)",
          description: "System sector mapped. Decoy paths detected. Seek the ★",
          width, height,
          startPos: { x: startX, y: startY },
          goalPos: { x: goal.x, y: goal.y },
          grid,
          scrollingVector: { x: 0, y: 0 }, scrollSpeed: 0,
          hints: ["Navigation noise increased.", "Trust the motions, verify the path."],
          demoPath: [] 
        };
      }
    }
  }

  // Final fallback: Use the last attempt even if it's not perfect
  return finalLevel || generateProceduralLevelSafe(id, seed);
}

/**
 * A simplified version that is guaranteed to produce A level quickly without recursion
 */
function generateProceduralLevelSafe(id: string, seed: string): Level {
  const width = 60;
  const height = 30;
  const grid: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = { char: ' ', isRevealed: false, type: 'empty' };
    }
  }

  const startX = 5;
  const startY = 5;
  const word = "SAFE_MODE";
  for (let i = 0; i < word.length; i++) {
    grid[startY][startX + i] = { char: word[i], isRevealed: false, type: 'path' };
  }
  const goalX = startX + word.length - 1;
  const goalY = startY;
  grid[goalY][goalX] = { char: '★', isRevealed: false, type: 'goal' };

  return {
    id,
    title: "Vim Runner (Recovery Mode)",
    description: "Emergency systems active. Find the exit.",
    width, height,
    startPos: { x: startX, y: startY },
    goalPos: { x: goalX, y: goalY },
    grid,
    scrollingVector: { x: 0, y: 0 }, scrollSpeed: 0,
    hints: ["Generation failed. Entering safe mode."],
    demoPath: []
  };
}
