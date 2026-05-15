
export enum VimMode {
  NORMAL = 'NORMAL',
  INSERT = 'INSERT',
  VISUAL = 'VISUAL',
  COMMAND = 'COMMAND'
}

export type Position = {
  x: number;
  y: number;
};

export type Cell = {
  char: string;
  isRevealed: boolean;
  type: 'path' | 'wall' | 'obstacle' | 'edit-zone' | 'goal' | 'empty';
  highlight?: 'delete' | 'change' | 'insert' | 'selection';
  metadata?: any;
};

export type Level = {
  id: string;
  title: string;
  description: string;
  width: number;
  height: number;
  startPos: Position;
  goalPos: Position;
  grid: Cell[][];
  scrollingVector: Position; // e.g., {x: 1, y: 0} for rightward pressure
  scrollSpeed: number;
  hints: string[];
  demoPath?: Position[];
};
