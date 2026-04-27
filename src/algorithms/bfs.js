import { getNeighbors, updateNodeDOM } from '../utils/boardUtils';

export const runBFS = async (algoId, baseGrid, startNode, endNode, sleep, updateStats) => {
  let queue = [{ r: startNode.r, c: startNode.c, path: [], cost: 0 }];
  let grid = baseGrid.map(row => row.map(n => ({...n, isVisited: false})));
  
  grid[startNode.r][startNode.c].isVisited = true;
  let visitedNodes = 0;

  while (queue.length > 0) {
    const current = queue.shift();
    const { r, c, path, cost } = current;
    
    visitedNodes++;
    updateStats({ visited: visitedNodes, cost: 0, status: 'Đang chạy...' });

    if (r !== startNode.r || c !== startNode.c) {
      updateNodeDOM(algoId, r, c, ['visited'], ['processing']);
    }

    if (r === endNode.r && c === endNode.c) {
      return { path: [...path, {r, c}], cost: cost + grid[r][c].weight };
    }

    const neighbors = getNeighbors(grid, r, c);
    for (const n of neighbors) {
      if (!grid[n.r][n.c].isVisited) {
        grid[n.r][n.c].isVisited = true;
        const newCost = cost + grid[n.r][n.c].weight;
        queue.push({ r: n.r, c: n.c, path: [...path, {r, c}], cost: newCost });
        
        if (n.r !== endNode.r || n.c !== endNode.c) {
          updateNodeDOM(algoId, n.r, n.c, ['processing']);
        }
      }
    }
    await sleep();
  }
  return null;
};
