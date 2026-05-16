# Vim Runner: The Modal Maze

An educational 2D game designed to master Vim motions and commands through a dynamic, grid-based maze.

## 🚀 Overview

In **Vim Runner**, you navigate a labyrinth of text. Unlike traditional games, movement is controlled exclusively through Vim commands. You must reach the goal (★) while staying ahead of the "Ghost" (a scrolling boundary representation) and navigating the fog of war.

## 🎮 Game Modes

### CLASSIC_OS
Carefully curated levels designed to teach specific mechanics and common code patterns. Perfect for beginners learning the basics of `h`, `j`, `k`, `l`.

### ENDLESS_VOID
Experience procedurally generated crossword-style mazes. Every session is unique.
- **Diagonal Spawning**: To ensure maximum challenge, the start and finish are strategically placed in opposite quadrants.
- **Dynamic Branching**: Complex paths with dead ends and intersecting words.
- **Spatial Sector Bias**: Guaranteed minimum travel distance for every level.

## ⌨️ Controls

### Navigation
- `h`, `j`, `k`, `l`: Move Left, Down, Up, Right.
- `w`: Jump to the start of the next word.
- `b`: Jump to the start of the previous word.
- `0` (Zero): Jump to the start of the current horizontal path.
- `$`: Jump to the end of the current horizontal path.
- `gg`: Jump to the top of the level.
- `G`: Jump to the bottom of the level.

## 🛠 Features

- **Fog of War**: Only the path immediately around you is revealed. Visibility is constrained to 3 characters ahead/behind on your current path to emphasize foresight and memory.
- **Procedural Engine**: Uses a dictionary-based branching algorithm to build logical mazes.
- **Safe Mode**: Robust generation logic with automatic fallbacks ensures that a playable level is always delivered.

## 📦 Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
