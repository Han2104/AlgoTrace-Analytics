import { getNeighbors, ROWS, COLS } from '../utils/boardUtils';
import { manhattanDistance } from '../utils/heuristics';

export const runAStar = async (algoId, baseGrid, startNode, endNode, sleep, updateStats) => {
  const startTime = performance.now();

  let pq = [{ r: startNode.r, c: startNode.c, g: 0, h: 0, f: 0, path: [] }];
  let gScore = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
  let grid = baseGrid.map(row => row.map(n => ({...n, isVisited: false})));
  
  gScore[startNode.r][startNode.c] = 0;
  let visitedNodes = 0;

  const startCalc = performance.now();

  while (pq.length > 0) {
    pq.sort((a, b) => a.f - b.f);
    const current = pq.shift();
    const { r, c, g, path } = current;

    if (grid[r][c].isVisited) continue;
    grid[r][c].isVisited = true;
    
    visitedNodes++;
    updateStats({ visited: visitedNodes, cost: g, status: 'Đang chạy...', time: (performance.now() - startTime).toFixed(2) });

    if (r === endNode.r && c === endNode.c) {
      const endCalc = performance.now();
      const calcTime = (endCalc - startCalc).toFixed(3);
      const elapsed = (performance.now() - startTime).toFixed(2);
      updateStats({ visited: visitedNodes, cost: g, status: 'Hoàn thành', time: elapsed });
      return { path: [...path, {r, c}], cost: g, time: elapsed, calcTime };
    }

    const neighbors = getNeighbors(grid, r, c);
    for (const n of neighbors) {
      if (grid[n.r][n.c].isVisited) continue;

      const tentativeG = g + grid[n.r][n.c].weight;
      if (tentativeG < gScore[n.r][n.c]) {
        gScore[n.r][n.c] = tentativeG;
        const h = manhattanDistance(n.r, n.c, endNode.r, endNode.c);
        const f = tentativeG + h;
        
        pq.push({ r: n.r, c: n.c, g: tentativeG, h: h, f: f, path: [...path, {r, c}] });
      }
    }
  }
  return null;
};
