import { getNeighbors, updateNodeDOM, ROWS, COLS } from '../utils/boardUtils';

// runDijkstra
// Header: Thuật toán Dijkstra trên lưới với trọng số không âm.
// Sử dụng mảng ưu tiên (priority array) sắp xếp mỗi vòng như một thay thế cho min-heap.
export const runDijkstra = async (algoId, baseGrid, startNode, endNode, sleep, updateStats, isBenchmark = false) => {
  // pq: mảng entry {r,c,cost,path}. Ta sort mảng này để chọn entry có cost nhỏ nhất.
  // Ghi chú (thiết kế PQ): Ở môi trường production nên dùng binary heap có hỗ trợ
  // decrease-key. Ở đây ta push các entry cập nhật và sort khi pop để đơn giản hóa
  // cài đặt, nhưng điều này kém hiệu quả hơn về thời gian so với heap (đắt hơn về O).
  let pq = [{ r: startNode.r, c: startNode.c, cost: 0, path: [] }];
  let dist = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
  let grid = baseGrid.map(row => row.map(n => ({...n, isVisited: false})));
  
  dist[startNode.r][startNode.c] = 0;
  let visitedNodes = 0;
  let maxFringeSize = pq.length;
  const t0 = isBenchmark ? performance.now() : null;

  while (pq.length > 0) {
    // Dùng sort trên mảng làm thay thế min-heap. Lưu ý đây là đánh đổi về hiệu năng so với heap.
    pq.sort((a, b) => a.cost - b.cost);
    const current = pq.shift();
    const { r, c, cost, path } = current;

    // Nếu ô đã được mark visited, entry này là cũ (chúng ta đã settle node đó)
    // nên có thể bỏ qua. Cách này xử lý ngầm các entry trùng cho cùng node khi không có decrease-key.
    if (grid[r][c].isVisited) continue;
    grid[r][c].isVisited = true;
    
    visitedNodes++;
    if (!isBenchmark) updateStats({ visited: visitedNodes, cost: cost, status: 'Đang chạy...' });

    if (!isBenchmark) {
      if (r !== startNode.r || c !== startNode.c) {
        let html = null;
        if (r !== endNode.r || c !== endNode.c) {
          html = `<span class="cost-text" style="font-size: 8px;">${cost}</span>`;
        }
        updateNodeDOM(algoId, r, c, ['visited'], ['processing'], html);
      }
    }

    if (r === endNode.r && c === endNode.c) {
      const foundPath = [...path, { r, c }];
      if (isBenchmark) {
        const end = performance.now();
        return { pathFound: true, executionTimeMs: end - t0, nodesExpanded: visitedNodes, pathLength: foundPath.length, totalCost: cost, maxFringeSize };
      }
      return { path: foundPath, cost: cost, pathLength: foundPath.length, totalCost: cost };
    }

    const neighbors = getNeighbors(grid, r, c);
    for (const n of neighbors) {
      const altCost = cost + grid[n.r][n.c].weight;
      // Relaxation step: nếu tìm thấy đường rẻ hơn, cập nhật dist và push vào pq.
      // Deep comment: vì không dùng decrease-key, chúng ta push một entry mới.
      // Khi entry cũ được pop sau đó, nó sẽ bị bỏ qua bởi check isVisited.
      if (altCost < dist[n.r][n.c]) {
        dist[n.r][n.c] = altCost;
        // Decrease-key emulation: update existing entry in pq if present
        const idx = pq.findIndex(e => e.r === n.r && e.c === n.c);
        if (idx >= 0) {
          if (altCost < pq[idx].cost) {
            pq[idx].cost = altCost;
            pq[idx].path = [...path, {r, c}];
          }
        } else {
          pq.push({ r: n.r, c: n.c, cost: altCost, path: [...path, {r, c}] });
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
