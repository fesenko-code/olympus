/**
 * Olympus battle grid — square-cell board with A* pathfinding.
 *
 * Reused/adapted from the two upstream projects per the reusability audit
 * (t_57fe1306): quadra-tactics `squaregrid.ts` (Chebyshev 8-dir square cells)
 * and zero-rts `grid.ts` (A* with corner-cut prevention + nearest-free
 * fallback). Olympus standardizes on the discrete cell-stepped model because
 * the MVP battle is turn/pause-stepped; the same coordinates map cleanly onto
 * zero-rts' continuous world later via `cellToWorld`.
 *
 * Pure, deterministic, DOM-free. No side effects beyond the `blocked` array.
 */

/** A cell coordinate on the square grid. */
export interface SquareCoord {
  x: number;
  y: number;
}

/** The 8 square-grid directions (4 orthogonal + 4 diagonal). */
export const SQUARE_DIRS: readonly SquareCoord[] = [
  { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 1 },
  { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
];

/** Chebyshev distance (diagonals cost 1). */
export function squareDistance(a: SquareCoord, b: SquareCoord): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/** True when two coords are identical. */
export function sameCell(a: SquareCoord, b: SquareCoord): boolean {
  return a.x === b.x && a.y === b.y;
}

/** All cells within `range` Chebyshev steps (inclusive square diamond). */
export function cellsInRange(center: SquareCoord, range: number): SquareCoord[] {
  const out: SquareCoord[] = [];
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) <= range) {
        out.push({ x: center.x + dx, y: center.y + dy });
      }
    }
  }
  return out;
}

interface ANode {
  x: number;
  y: number;
  f: number;
  g: number;
}

/**
 * Square grid board. Cells are blocked (1) or free (0). Supports A* pathing
 * between cells with diagonal corner-cut prevention.
 */
export class Grid {
  readonly cols: number;
  readonly rows: number;
  readonly blocked: Uint8Array;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.blocked = new Uint8Array(cols * rows);
  }

  private idx(x: number, y: number): number {
    return y * this.cols + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }

  isBlocked(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return true;
    return this.blocked[this.idx(x, y)] === 1;
  }

  /** Block or free a single cell. */
  setBlocked(x: number, y: number, val: boolean): void {
    if (this.inBounds(x, y)) this.blocked[this.idx(x, y)] = val ? 1 : 0;
  }

  /** Block a rectangular footprint of cells. */
  setRect(x: number, y: number, w: number, h: number, val: boolean): void {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) this.setBlocked(x + dx, y + dy, val);
    }
  }

  /** The up-to-8 walkable neighbours of a cell. */
  neighbors(c: SquareCoord): SquareCoord[] {
    const out: SquareCoord[] = [];
    for (const d of SQUARE_DIRS) {
      const nx = c.x + d.x;
      const ny = c.y + d.y;
      if (!this.isBlocked(nx, ny)) out.push({ x: nx, y: ny });
    }
    return out;
  }

  /** Nearest free cell to (x,y) within a small radius (spiral search). */
  nearestFree(x: number, y: number): SquareCoord | null {
    if (!this.isBlocked(x, y)) return { x, y };
    for (let r = 1; r < Math.max(this.cols, this.rows); r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (this.inBounds(nx, ny) && !this.isBlocked(nx, ny)) return { x: nx, y: ny };
        }
      }
    }
    return null;
  }

  /**
   * A* from `from` to `to`. Returns the list of cells to walk (excluding the
   * start), or [] if unreachable. Diagonals cost √2 and never cut corners.
   */
  findPath(from: SquareCoord, to: SquareCoord): SquareCoord[] {
    const start = this.nearestFree(from.x, from.y);
    let goal = this.nearestFree(to.x, to.y);
    if (!start || !goal) return [];
    if (sameCell(start, goal)) return [];

    const open: ANode[] = [];
    const gScore = new Map<number, number>();
    const came = new Map<number, number>();
    const h = (x: number, y: number): number => Math.abs(x - goal.x) + Math.abs(y - goal.y);
    const sIdx = this.idx(start.x, start.y);
    gScore.set(sIdx, 0);
    open.push({ x: start.x, y: start.y, f: h(start.x, start.y), g: 0 });

    let iter = 0;
    const maxIter = this.cols * this.rows * 4;
    while (open.length > 0 && iter++ < maxIter) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0];
      if (cur.x === goal.x && cur.y === goal.y) return this.reconstruct(came, this.idx(cur.x, cur.y));
      const curIdx = this.idx(cur.x, cur.y);
      for (const d of SQUARE_DIRS) {
        const nx = cur.x + d.x;
        const ny = cur.y + d.y;
        if (this.isBlocked(nx, ny)) continue;
        if (d.x !== 0 && d.y !== 0) {
          // no corner cutting
          if (this.isBlocked(cur.x + d.x, cur.y) || this.isBlocked(cur.x, cur.y + d.y)) continue;
        }
        const step = d.x !== 0 && d.y !== 0 ? 1.41421 : 1;
        const ng = cur.g + step;
        const nIdx = this.idx(nx, ny);
        if (ng < (gScore.get(nIdx) ?? Infinity)) {
          gScore.set(nIdx, ng);
          came.set(nIdx, curIdx);
          const f = ng + h(nx, ny);
          const existing = open.find((n) => n.x === nx && n.y === ny);
          if (existing) {
            existing.g = ng;
            existing.f = f;
          } else {
            open.push({ x: nx, y: ny, f, g: ng });
          }
        }
      }
    }
    return [];
  }

  private reconstruct(came: Map<number, number>, endIdx: number): SquareCoord[] {
    const cells: number[] = [endIdx];
    let c = endIdx;
    while (came.has(c)) {
      c = came.get(c)!;
      cells.push(c);
    }
    cells.reverse();
    return cells.slice(1).map((ci) => ({ x: ci % this.cols, y: Math.floor(ci / this.cols) }));
  }
}
