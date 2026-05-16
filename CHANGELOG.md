# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-05-16

### Added
- **Procedural Generation Engine**: A new dictionary-based algorithm that generates crossword-style levels.
- **Endless Void Mode**: A game mode that utilizes the new procedural engine for infinite replayability.
- **Sector-Based Quadrant Spawning**: Logic that guarantees the start and finish points are placed in diagonal quadrants (e.g., Top-Left to Bottom-Right).
- **Physical Distance Verification**: Implemented Manhattan distance checks (minimum 45% grid perimeter travel) to ensure levels aren't too short.
- **Game Mode Selection**: New UI toggle in the boot screen to switch between Classic and Endless modes.
- **Mode-Specific Theming**: The UI now shifts color schemes (Sky Blue for Classic, Emerald Green for Endless) based on selection.

### Changed
- **Fog of War Overhaul**: Replaced the radial visibility logic with a "Segment Lookahead" system. Now, only 3 characters ahead and behind on the current active segment are revealed.
- **Movement Reveal**: Moving into a new intersection now immediately provides a 3-character "peek" into the connecting paths.
- **Generation Robustness**: Replaced recursive level generation with an iterative loop to prevent `Maximum call stack size exceeded` errors.

### Fixed
- **Stack Overflow**: Fixed a critical `RangeError` by adding generation attempt limits and threshold loosening for level validation.
- **Safe Mode Fallback**: Added a non-recursive "Recovery Mode" level generator that activates if complex generation fails repeatedly.
- **Path Collisions**: Refined cardinal neighbor checks to allow for more compact and dense word paths without overlapping character garbage.

## [1.0.0] - 2026-05-15

### Added
- Initial project release.
- Basic Vim navigation engine (`h`, `j`, `k`, `l`, `w`, `b`, `0`, `$`, `gg`, `G`).
- Terminal-inspired UI and grid rendering.
- Basic level manifest system.
