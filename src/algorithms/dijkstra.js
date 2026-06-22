import { getNeighbors, updateNodeDOM, ROWS, COLS } from '../utils/boardUtils';

export const runDijkstra = async (algoId, baseGrid, startNode, endNode, sleep, updateStats) => {
  const startTime = performance.now();
  let nodesProcessedInFrame = 0;
  const batchSize = 15;

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
    nodesProcessedInFrame++;
    updateStats({ visited: visitedNodes, cost: cost, status: 'Đang chạy...', time: (performance.now() - startTime).toFixed(2) });

    if (r !== startNode.r || c !== startNode.c) {
      let html = null;
      if (r !== endNode.r || c !== endNode.c) {
        html = `<span class="cost-text" style="font-size: 7px;">${cost}</span>`;
      }
      updateNodeDOM(algoId, r, c, ['visited'], ['processing'], html);
    }

    if (r === endNode.r && c === endNode.c) {
      const elapsed = (performance.now() - startTime).toFixed(2);
      updateStats({ visited: visitedNodes, cost: cost, status: 'Hoàn thành', time: elapsed });
      return { path: [...path, {r, c}], cost: cost, time: elapsed };
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

    if (nodesProcessedInFrame % batchSize === 0) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      nodesProcessedInFrame = 0;
    }
  }
  return null;
};
