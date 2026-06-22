import { getNeighbors, updateNodeDOM } from '../utils/boardUtils';

// runDFS
// Header: Cài đặt Depth-First Search (DFS) theo dạng lặp sử dụng stack rõ ràng.
// Dùng để khám phá sâu theo nhánh; không đảm bảo tìm đường đi ngắn nhất.
export const runDFS = async (algoId, baseGrid, startNode, endNode, sleep, updateStats, isBenchmark = false) => {
  // TỐI ƯU 1: Loại bỏ mảng 'path' khỏi stack. Chỉ lưu r, c và cost để siêu tiết kiệm RAM.
  let stack = [{ r: startNode.r, c: startNode.c, cost: 0 }];
  let visitedNodes = 0;
  let maxFringeSize = stack.length;
  const t0 = isBenchmark ? performance.now() : null;

  // TỐI ƯU 2: Bổ sung 'previousNode' để đánh dấu vết đường đi
  let grid = baseGrid.map(row => row.map(n => ({ ...n, isVisited: false, previousNode: null })));

  while (stack.length > 0) {
    const current = stack.pop();
    const { r, c, cost } = current;

    if (grid[r][c].isVisited) continue;

    grid[r][c].isVisited = true;
    visitedNodes++;
    
    if (!isBenchmark) updateStats({ visited: visitedNodes, cost: cost, status: 'Đang chạy...' });

    if (!isBenchmark) {
      if (r !== startNode.r || c !== startNode.c) {
        updateNodeDOM(algoId, r, c, ['visited'], ['processing']);
      }
    }

    if (r === endNode.r && c === endNode.c) {
      // TỐI ƯU 3: Dò ngược đường đi (Traceback) từ End về Start
      const foundPath = [];
      let trueCost = 0;
      let traceR = r;
      let traceC = c;
      
      while (traceR !== startNode.r || traceC !== startNode.c) {
        foundPath.unshift({ r: traceR, c: traceC });
        trueCost += grid[traceR][traceC].weight; // Cộng dồn trọng số chuẩn xác
        const prev = grid[traceR][traceC].previousNode;
        traceR = prev.r;
        traceC = prev.c;
      }
      foundPath.unshift({ r: startNode.r, c: startNode.c });

      if (isBenchmark) {
        const end = performance.now();
        return { 
          pathFound: true, 
          executionTimeMs: end - t0, 
          nodesExpanded: visitedNodes, 
          pathLength: foundPath.length, 
          totalCost: trueCost, 
          maxFringeSize 
        };
      }
      return { path: foundPath, cost: trueCost, pathLength: foundPath.length, totalCost: trueCost };
    }

    if (!isBenchmark) await sleep();

    const neighbors = getNeighbors(grid, r, c);
    let unvisitedCount = 0;

    for (let i = neighbors.length - 1; i >= 0; i--) {
      const n = neighbors[i];
      if (!grid[n.r][n.c].isVisited) {
        // TỐI ƯU 4: Lưu lại "sợi chỉ Ariadne" để biết đường quay về
        grid[n.r][n.c].previousNode = { r, c };
        
        // Tính chi phí trực tiếp trên stack thay vì tính bù ở cuối
        const newCost = cost + grid[n.r][n.c].weight;
        
        stack.push({ r: n.r, c: n.c, cost: newCost });
        maxFringeSize = Math.max(maxFringeSize, stack.length);
        
        if (!isBenchmark) {
          if (n.r !== endNode.r || n.c !== endNode.c) {
            updateNodeDOM(algoId, n.r, n.c, ['processing']);
          }
        }
        unvisitedCount++;
      }
    }

    if (unvisitedCount === 0 && (r !== startNode.r || c !== startNode.c)) {
      if (!isBenchmark) {
        updateNodeDOM(algoId, r, c, ['backtrack'], ['visited']);
        await sleep();
      }
    }
  }

  if (isBenchmark) {
    const end = performance.now();
    return { pathFound: false, executionTimeMs: end - t0, nodesExpanded: visitedNodes, pathLength: 0, totalCost: 0, maxFringeSize };
  }
  return null;
};