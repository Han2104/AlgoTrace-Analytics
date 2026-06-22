import { getNeighbors, updateNodeDOM, ROWS, COLS } from '../utils/boardUtils';
import { manhattanDistance } from '../utils/heuristics';

export const runAStar = async (algoId, baseGrid, startNode, endNode, sleep, updateStats) => {
  const startTime = performance.now();
  let nodesProcessedInFrame = 0;
  const batchSize = 15;

  let pq = [{ r: startNode.r, c: startNode.c, g: 0, h: 0, f: 0, path: [] }];
  let gScore = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
  let grid = baseGrid.map(row => row.map(n => ({...n, isVisited: false})));
  
  gScore[startNode.r][startNode.c] = 0;
  let visitedNodes = 0;

  while (pq.length > 0) {
    pq.sort((a, b) => a.f - b.f);
    const current = pq.shift();
    const { r, c, g, path } = current;

    if (grid[r][c].isVisited) continue;
    grid[r][c].isVisited = true;
    
    visitedNodes++;
    nodesProcessedInFrame++;
    updateStats({ visited: visitedNodes, cost: g, status: 'Đang chạy...', time: (performance.now() - startTime).toFixed(2) });

    if (r !== startNode.r || c !== startNode.c) {
      let html = null;
      if (r !== endNode.r || c !== endNode.c) {
        html = `<span class="cost-text" style="font-size: 6px; line-height: 1;">f:${current.f}<br>g:${g}</span>`;
      }
      updateNodeDOM(algoId, r, c, ['visited'], ['processing'], html);
    }

    if (r === endNode.r && c === endNode.c) {
      const elapsed = (performance.now() - startTime).toFixed(2);
      updateStats({ visited: visitedNodes, cost: g, status: 'Hoàn thành', time: elapsed });
      return { path: [...path, {r, c}], cost: g, time: elapsed };
    }

    const neighbors = getNeighbors(grid, r, c);
    for (const n of neighbors) {
      if (grid[n.r][n.c].isVisited) continue;

      const tentativeG = g + grid[n.r][n.c].weight;
      if (tentativeG < gScore[n.r][n.c]) {
        gScore[n.r][n.c] = tentativeG;
        const h = manhattanDistance(n.r, n.c, endNode.r, endNode.c) * 10; 
        const f = tentativeG + h;
        
        pq.push({ r: n.r, c: n.c, g: tentativeG, h: h, f: f, path: [...path, {r, c}] });
        
        if (n.r !== endNode.r || n.c !== endNode.c) {
          updateNodeDOM(algoId, n.r, n.c, ['processing']);
        }
      }
    }

    if (nodesProcessedInFrame % batchSize === 0) {
      // yield to the browser to allow a frame paint
      await new Promise(resolve => requestAnimationFrame(resolve));
      nodesProcessedInFrame = 0;
    }
  }
  return null;
};
