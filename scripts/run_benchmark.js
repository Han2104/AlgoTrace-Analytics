import fs from 'fs';
import { runAStar } from '../src/algorithms/astar.js';
import { runBFS } from '../src/algorithms/bfs.js';
import { runDFS } from '../src/algorithms/dfs.js';
import { runDijkstra } from '../src/algorithms/dijkstra.js';
import { ROWS, COLS } from '../src/utils/boardUtils.js';

const ALGORITHMS = [
  { name: 'Dijkstra', fn: runDijkstra },
  { name: 'DFS', fn: runDFS },
  { name: 'BFS', fn: runBFS },
  { name: 'A*', fn: runAStar },
];

const TRIALS_PER_MAP = 500;
const OUTPUT_CSV = 'benchmark_results.csv';

const noopSleep = async () => {};
const noopStats = () => {};

const deepCloneGrid = (grid) => grid.map(row => row.map(n => ({ ...n })));

// Map generators
const makeEmpty = () => {
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) row.push({ r, c, isWall: false, weight: 1 });
    grid.push(row);
  }
  return grid;
};

const makeRandom = (wallProb = 0.2) => {
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) row.push({ r, c, isWall: Math.random() < wallProb, weight: 1 });
    grid.push(row);
  }
  return grid;
};

// Simple maze using randomized DFS on a cell grid (carve passages by jumping 2 cells)
const makeMaze = () => {
  // Start with all walls
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) row.push({ r, c, isWall: true, weight: 1 });
    grid.push(row);
  }

  const inBounds = (r, c) => r >= 0 && c >= 0 && r < ROWS && c < COLS;
  const dirs = [ [0,2],[0,-2],[2,0],[-2,0] ];

  const start = { r: 0, c: 0 };
  const stack = [start];
  grid[start.r][start.c].isWall = false;

  while (stack.length) {
    const cur = stack.pop();
    // shuffle dirs
    const order = dirs.slice().sort(()=>Math.random()-0.5);
    for (const [dr, dc] of order) {
      const nr = cur.r + dr;
      const nc = cur.c + dc;
      if (!inBounds(nr, nc)) continue;
      if (!grid[nr][nc].isWall) continue;
      // carve passage between cur and neighbor
      const betweenR = cur.r + dr/2;
      const betweenC = cur.c + dc/2;
      if (inBounds(betweenR, betweenC)) grid[betweenR][betweenC].isWall = false;
      grid[nr][nc].isWall = false;
      stack.push(cur);
      stack.push({ r: nr, c: nc });
    }
  }
  return grid;
};

const makeWeighted = () => {
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      // Make some heavier nodes randomly; no walls
      const weight = Math.random() < 0.2 ? (2 + Math.floor(Math.random()*8)) : 1;
      row.push({ r, c, isWall: false, weight });
    }
    grid.push(row);
  }
  return grid;
};

const makeWarehouse = () => {
  // Create shelves: blocks of walls with aisles
  const grid = makeEmpty();
  const shelfHeight = 3;
  const shelfWidth = 4;
  const gap = 2; // aisle gap
  for (let r = 1; r < ROWS-1; r += shelfHeight + gap) {
    for (let c = 1; c < COLS-1; c += shelfWidth + 1) {
      // Create a block
      for (let sr = 0; sr < shelfHeight && r+sr < ROWS-1; sr++) {
        for (let sc = 0; sc < shelfWidth && c+sc < COLS-1; sc++) {
          grid[r+sr][c+sc].isWall = true;
        }
      }
    }
  }
  return grid;
};

const ensureEndpointsOpen = (grid, startNode, endNode) => {
  grid[startNode.r][startNode.c].isWall = false;
  grid[endNode.r][endNode.c].isWall = false;
};

const generators = [
  { name: 'Empty', gen: makeEmpty },
  { name: 'Random20', gen: () => makeRandom(0.2) },
  { name: 'Maze', gen: makeMaze },
  { name: 'Weighted', gen: makeWeighted },
  { name: 'Warehouse', gen: makeWarehouse },
];

const results = [];

const run = async () => {
  const startNode = { r: 0, c: 0 };
  const endNode = { r: ROWS - 1, c: COLS - 1 };

  for (const { name: mapName, gen } of generators) {
    console.log(`Starting tests for map: ${mapName}`);
    const baseMap = gen();
    // Ensure endpoints are open
    ensureEndpointsOpen(baseMap, startNode, endNode);

    for (let i = 0; i < TRIALS_PER_MAP; i++) {
      if (i % 50 === 0) console.log(`${mapName} - trial ${i}/${TRIALS_PER_MAP}`);
      const gridClone = deepCloneGrid(baseMap);
      ensureEndpointsOpen(gridClone, startNode, endNode);

      for (const algo of ALGORITHMS) {
        try {
          const res = await algo.fn('bench', gridClone, startNode, endNode, noopSleep, noopStats, true);
          // res expected to be the benchmark object
          const record = {
            algorithm: algo.name,
            map: mapName,
            trial: i + 1,
            executionTimeMs: res && res.executionTimeMs != null ? Number(res.executionTimeMs.toFixed(3)) : '',
            nodesExpanded: res && res.nodesExpanded != null ? res.nodesExpanded : '',
            pathLength: res && res.pathLength != null ? res.pathLength : '',
            pathFound: res && typeof res.pathFound === 'boolean' ? res.pathFound : '',
            maxFringeSize: res && res.maxFringeSize != null ? res.maxFringeSize : '',
          };
          results.push(record);
        } catch (err) {
          console.error(`Error running ${algo.name} on ${mapName} trial ${i+1}:`, err);
          results.push({ algorithm: algo.name, map: mapName, trial: i+1, error: String(err) });
        }
      }
    }
  }

  // Write CSV
  const header = ['algorithm','map','trial','executionTimeMs','nodesExpanded','pathLength','pathFound','maxFringeSize'];
  const lines = [header.join(',')];
  for (const r of results) {
    const row = [
      r.algorithm,
      r.map,
      r.trial,
      r.executionTimeMs,
      r.nodesExpanded,
      r.pathLength,
      r.pathFound,
      r.maxFringeSize,
    ];
    lines.push(row.join(','));
  }

  fs.writeFileSync(OUTPUT_CSV, lines.join('\n'));
  console.log(`Benchmark complete. Results written to ${OUTPUT_CSV}`);
};

run();
