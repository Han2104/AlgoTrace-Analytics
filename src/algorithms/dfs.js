import { getNeighbors, updateNodeDOM } from '../utils/boardUtils';

export const runDFS = async (algoId, baseGrid, startNode, endNode, sleep, updateStats) => {
  let stack = [{ r: startNode.r, c: startNode.c, path: [], cost: 0 }];
  let visitedNodes = 0;
  
  // Clone to track visited state specific to DFS
  let grid = baseGrid.map(row => row.map(n => ({...n, isVisited: false})));

  while (stack.length > 0) {
    const current = stack.pop();
    const { r, c, path, cost } = current;
    
    if (grid[r][c].isVisited) continue;
    
    grid[r][c].isVisited = true;
    visitedNodes++;
    updateStats({ visited: visitedNodes, cost: 0, status: 'Đang chạy...' });
    
    const newPath = [...path, {r, c}];
    const newCost = cost + grid[r][c].weight;
    
    if (r !== startNode.r || c !== startNode.c) {
      updateNodeDOM(algoId, r, c, ['visited'], ['processing']);
    }

    if (r === endNode.r && c === endNode.c) {
      return { path: newPath, cost: newCost };
    }
    
    await sleep();
    
    const neighbors = getNeighbors(grid, r, c);
    let unvisitedCount = 0;
    
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const n = neighbors[i];
      if (!grid[n.r][n.c].isVisited) {
        stack.push({ r: n.r, c: n.c, path: newPath, cost: newCost });
        if (n.r !== endNode.r || n.c !== endNode.c) {
            updateNodeDOM(algoId, n.r, n.c, ['processing']);
        }
        unvisitedCount++;
      }
    }
    
    if (unvisitedCount === 0 && (r !== startNode.r || c !== startNode.c)) {
      updateNodeDOM(algoId, r, c, ['backtrack'], ['visited']);
      await sleep();
    }
  }
  return null;
};
