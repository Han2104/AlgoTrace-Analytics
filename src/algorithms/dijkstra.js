import { getNeighbors, ROWS, COLS } from '../utils/boardUtils';

export const runDijkstra = async (algoId, baseGrid, startNode, endNode, sleep, updateStats) => {
  const startTime = performance.now();

  let pq = [{ r: startNode.r, c: startNode.c, cost: 0, path: [] }];
  let dist = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
  let grid = baseGrid.map(row => row.map(n => ({...n, isVisited: false})));
  
  dist[startNode.r][startNode.c] = 0;
  let visitedNodes = 0;

  const startCalc = performance.now();

  while (pq.length > 0) {
    pq.sort((a, b) => a.cost - b.cost); 
    const current = pq.shift();
    const { r, c, cost, path } = current;

    if (grid[r][c].isVisited) continue;
    grid[r][c].isVisited = true;
    
    visitedNodes++;
    updateStats({ visited: visitedNodes, cost: cost, status: 'Đang chạy...', time: (performance.now() - startTime).toFixed(2) });

    if (r === endNode.r && c === endNode.c) {
      const endCalc = performance.now();
      const calcTime = (endCalc - startCalc).toFixed(3);
      const elapsed = (performance.now() - startTime).toFixed(2);
      updateStats({ visited: visitedNodes, cost: cost, status: 'Hoàn thành', time: elapsed });
      return { path: [...path, {r, c}], cost: cost, time: elapsed, calcTime };
    }

    const neighbors = getNeighbors(grid, r, c);
    for (const n of neighbors) {
      const altCost = cost + grid[n.r][n.c].weight;
      if (altCost < dist[n.r][n.c]) {
        dist[n.r][n.c] = altCost;
        pq.push({ r: n.r, c: n.c, cost: altCost, path: [...path, {r, c}] });
      }
    }
  }
  return null;
};
