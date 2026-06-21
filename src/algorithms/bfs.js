import { getNeighbors, updateNodeDOM } from '../utils/boardUtils';

// runBFS
// Header: Thực hiện Breadth-First Search (BFS) trên lưới không trọng số.
// Trả về object { path, cost } nếu tìm thấy đường đi, hoặc null nếu không tìm.
export const runBFS = async (algoId, baseGrid, startNode, endNode, sleep, updateStats, isBenchmark = false) => {
  // Open set: queue (FIFO) đảm bảo khám phá theo lớp (số bước tăng dần).
  // Lưu ý: Cài đặt hiện tại lưu toàn bộ `path` trong mỗi entry của queue,
  // điều này giúp trả về đường đi đơn giản nhưng tiêu tốn bộ nhớ hơn so với
  // việc chỉ lưu `parent` map rồi reconstruct sau.
  let queue = [{ r: startNode.r, c: startNode.c, path: [], cost: 0 }];

  // Clone grid để lưu trạng thái isVisited riêng cho thuật toán này.
  // Clone tránh side-effect lên state gốc dùng cho UI hoặc thuật toán khác.
  let grid = baseGrid.map(row => row.map(n => ({...n, isVisited: false})));
  
  // Đánh dấu start là visited để tránh push lại start vào queue
  grid[startNode.r][startNode.c].isVisited = true;
  let visitedNodes = 0;
  let maxFringeSize = queue.length;
  const t0 = isBenchmark ? performance.now() : null;

  while (queue.length > 0) {
    // Dequeue: BFS đảm bảo node được xử lý theo thứ tự khoảng cách bước tăng dần
    const current = queue.shift();
    const { r, c, path, cost } = current;
    
    visitedNodes++;
    if (!isBenchmark) updateStats({ visited: visitedNodes, cost: cost, status: 'Đang chạy...' });

    if (!isBenchmark) {
      if (r !== startNode.r || c !== startNode.c) {
        updateNodeDOM(algoId, r, c, ['visited'], ['processing']);
      }
    }

    // Nếu gặp target, trả về path hiện tại + node này
    // Lưu ý: `path` được xây dựng dần khi push neighbor nên không cần bước backtracking riêng
    if (r === endNode.r && c === endNode.c) {
      const foundPath = [...path, { r, c }];
      // Recompute true total cost by summing node weights along the found path (exclude start node weight)
      let trueCost = foundPath.reduce((acc, n) => acc + grid[n.r][n.c].weight, 0) - grid[startNode.r][startNode.c].weight;
      if (isBenchmark) {
        const end = performance.now();
        return { pathFound: true, executionTimeMs: end - t0, nodesExpanded: visitedNodes, pathLength: foundPath.length, totalCost: trueCost, maxFringeSize };
      }
      return { path: foundPath, cost: trueCost, pathLength: foundPath.length, totalCost: trueCost };
    }

    // Lấy neighbors theo quy tắc 4-láng giềng (được lọc bởi getNeighbors)
    const neighbors = getNeighbors(grid, r, c);
    for (const n of neighbors) {
      // visited flag ngăn push lại cùng node -> tránh vòng lặp
      if (!grid[n.r][n.c].isVisited) {
        grid[n.r][n.c].isVisited = true;
        // BFS is unweighted for cost calculations: each step costs 1
        const newCost = cost + 1;
        // Push neighbor kèm bản sao `path`: cách làm đơn giản nhưng chi phí sao chép tăng theo độ dài đường dẫn
        queue.push({ r: n.r, c: n.c, path: [...path, {r, c}], cost: newCost });
        maxFringeSize = Math.max(maxFringeSize, queue.length);

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
    return { pathFound: false, executionTimeMs: end - t0, nodesExpanded: visitedNodes, totalCost: 0, maxFringeSize };
  }
  return null;
};
