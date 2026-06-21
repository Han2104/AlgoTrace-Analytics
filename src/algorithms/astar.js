import { getNeighbors, updateNodeDOM, ROWS, COLS } from '../utils/boardUtils';
import { manhattanDistance } from '../utils/heuristics';

// runAStar
// Header: Thuật toán A* sử dụng f = g + h.
// Đã tích hợp cờ isBenchmark để chạy ngầm (headless mode) trong Node.js.
export const runAStar = async (algoId, baseGrid, startNode, endNode, sleep, updateStats, isBenchmark = false) => {
  let pq = [{ r: startNode.r, c: startNode.c, g: 0, h: 0, f: 0, path: [] }];
  let gScore = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
  let grid = baseGrid.map(row => row.map(n => ({...n, isVisited: false})));
  
  gScore[startNode.r][startNode.c] = 0;
  let visitedNodes = 0;
  let maxFringeSize = pq.length;
  const t0 = isBenchmark ? performance.now() : null;

  while (pq.length > 0) {
    // Tie-breaking: prefer smaller h when f equal
    pq.sort((a, b) => a.f === b.f ? a.h - b.h : a.f - b.f);
    const current = pq.shift();
    const { r, c, g, path } = current;

    if (grid[r][c].isVisited) continue;
    grid[r][c].isVisited = true;
    
    visitedNodes++;
    
    if (!isBenchmark) {
      updateStats({ visited: visitedNodes, cost: g, status: 'Đang chạy...' });
      
      if (r !== startNode.r || c !== startNode.c) {
        let html = null;
        if (r !== endNode.r || c !== endNode.c) {
          html = `<span class="cost-text" style="font-size: 7px; line-height: 1;">f:${current.f}<br>g:${g}</span>`;
        }
        updateNodeDOM(algoId, r, c, ['visited'], ['processing'], html);
      }
    }

    if (r === endNode.r && c === endNode.c) {
      const foundPath = [...path, { r, c }];
      if (isBenchmark) {
        const end = performance.now();
        return {
          pathFound: true,
          executionTimeMs: end - t0,
          nodesExpanded: visitedNodes,
          pathLength: foundPath.length,
          totalCost: g,
          maxFringeSize
        };
      }
      return { path: foundPath, cost: g, pathLength: foundPath.length, totalCost: g };
    }

    const neighbors = getNeighbors(grid, r, c);
    for (const n of neighbors) {
      if (grid[n.r][n.c].isVisited) continue;

      const tentativeG = g + grid[n.r][n.c].weight;
      if (tentativeG < gScore[n.r][n.c]) {
        gScore[n.r][n.c] = tentativeG;
        
        // Đảm bảo tính Admissible tuyệt đối (không nhân trọng số ảo)
        const h = manhattanDistance(n.r, n.c, endNode.r, endNode.c); 
        const f = tentativeG + h;
        
        // Decrease-key emulation: update existing entry in pq if present
        const idx = pq.findIndex(e => e.r === n.r && e.c === n.c);
        if (idx >= 0) {
          if (tentativeG < pq[idx].g) {
            pq[idx].g = tentativeG;
            pq[idx].h = h;
            pq[idx].f = f;
            pq[idx].path = [...path, {r, c}];
          }
        } else {
          pq.push({ r: n.r, c: n.c, g: tentativeG, h: h, f: f, path: [...path, {r, c}] });
          maxFringeSize = Math.max(maxFringeSize, pq.length);
        }
        
        if (!isBenchmark) {
          if (n.r !== endNode.r || n.c !== endNode.c) {
            updateNodeDOM(algoId, n.r, n.c, ['processing']);
          }
        }
      }
    }
    
    if (!isBenchmark) await sleep();
  }
  
  if (isBenchmark) {
    const end = performance.now();
    return { pathFound: false, executionTimeMs: end - t0, nodesExpanded: visitedNodes, pathLength: 0, totalCost: 0, maxFringeSize };
  }
  return null;
};