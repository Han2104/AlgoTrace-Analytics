import { getNeighbors, updateNodeDOM } from '../utils/boardUtils';

// runDFS
// Header: Cài đặt Depth-First Search (DFS) theo dạng lặp sử dụng stack rõ ràng.
// Dùng để khám phá sâu theo nhánh; không đảm bảo tìm đường đi ngắn nhất.
export const runDFS = async (algoId, baseGrid, startNode, endNode, sleep, updateStats, isBenchmark = false) => {
  // Open set: stack (LIFO). Cài đặt dạng lặp tránh rủi ro tràn ngăn xếp khi đệ quy
  // quá sâu và cho phép ta kiểm soát rõ ràng hành vi push/pop.
  let stack = [{ r: startNode.r, c: startNode.c, path: [], cost: 0 }];
  let visitedNodes = 0;
  let maxFringeSize = stack.length;
  const t0 = isBenchmark ? performance.now() : null;

  // Clone grid để đánh dấu visited riêng cho thuật toán này.
  let grid = baseGrid.map(row => row.map(n => ({ ...n, isVisited: false })));

  while (stack.length > 0) {
    const current = stack.pop();
    const { r, c, path, cost } = current;

    // Nếu đã visited (được mark bởi một lần push trước đó) thì bỏ qua.
    if (grid[r][c].isVisited) continue;

    grid[r][c].isVisited = true;
    visitedNodes++;
    if (!isBenchmark) updateStats({ visited: visitedNodes, cost: cost, status: 'Đang chạy...' });

      const newPath = [...path, { r, c }];
      // DFS treated as unweighted for cost reporting: each step costs 1
      const newCost = cost + 1;

    if (!isBenchmark) {
      if (r !== startNode.r || c !== startNode.c) {
        updateNodeDOM(algoId, r, c, ['visited'], ['processing']);
      }
    }

    if (r === endNode.r && c === endNode.c) {
      const foundPath = newPath;
      // Reconstruct true cost by summing weights along the found path (exclude start node)
      let trueCost = foundPath.reduce((acc, n) => acc + grid[n.r][n.c].weight, 0) - grid[startNode.r][startNode.c].weight;
      if (isBenchmark) {
        const end = performance.now();
        return { pathFound: true, executionTimeMs: end - t0, nodesExpanded: visitedNodes, pathLength: foundPath.length, totalCost: trueCost, maxFringeSize };
      }
      return { path: foundPath, cost: trueCost, pathLength: foundPath.length, totalCost: trueCost };
    }

    if (!isBenchmark) await sleep();

    const neighbors = getNeighbors(grid, r, c);
    let unvisitedCount = 0;

    // Duyệt neighbors theo thứ tự ngược lại để kiểm soát thứ tự khám phá một cách xác định
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const n = neighbors[i];
      if (!grid[n.r][n.c].isVisited) {
        // Push neighbor kèm path hiện tại (đánh đổi bộ nhớ so với lưu parent map)
        stack.push({ r: n.r, c: n.c, path: newPath, cost: newCost });
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
      // Mark backtrack visually: node đã không còn neighbor chưa thăm
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
