import { getNeighbors, updateNodeDOM, ROWS, COLS } from '../utils/boardUtils';

export const runDijkstra = async (algoId, baseGrid, startNode, endNode, sleep, updateStats) => {
  let pq = [{ r: startNode.r, c: startNode.c, cost: 0, path: [] }];
  let dist = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
  let grid = baseGrid.map(row => row.map(n => ({...n, isVisited: false})));
  
  dist[startNode.r][startNode.c] = 0;
  let visitedNodes = 0;

  while (pq.length > 0) {
    pq.sort((a, b) => a.cost - b.cost); 
    const current = pq.shift();
    const { r, c, cost, path } = current;

    if (grid[r][c].isVisited) continue;
    grid[r][c].isVisited = true;
    
    visitedNodes++;
    updateStats({ visited: visitedNodes, cost: cost, status: 'Đang chạy...' });

    if (r !== startNode.r || c !== startNode.c) {
      let html = null;
      if (r !== endNode.r || c !== endNode.c) {
        html = `<span class="cost-text" style="font-size: 8px;">${cost}</span>`;
      }
      updateNodeDOM(algoId, r, c, ['visited'], ['processing'], html);
    }

    if (r === endNode.r && c === endNode.c) {
      return { path: [...path, {r, c}], cost: cost };
    }

    const neighbors = getNeighbors(grid, r, c);
    for (const n of neighbors) {
      const altCost = cost + grid[n.r][n.c].weight;
      if (altCost < dist[n.r][n.c]) {
        dist[n.r][n.c] = altCost;
        pq.push({ r: n.r, c: n.c, cost: altCost, path: [...path, {r, c}] });
        
        if (n.r !== endNode.r || n.c !== endNode.c) {
          updateNodeDOM(algoId, n.r, n.c, ['processing']);
        }
      }
    }
    await sleep();
  }
  return null;
};
