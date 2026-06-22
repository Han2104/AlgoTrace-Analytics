import { getNeighbors } from '../utils/boardUtils';

export const runDFS = async (algoId, baseGrid, startNode, endNode, sleep, updateStats) => {
  const startTime = performance.now();
  // Chỉ lưu tọa độ r, c và cost hiện tại. Tuyệt đối không lưu mảng path vào stack.
  let stack = [{ r: startNode.r, c: startNode.c, cost: 0 }];
  let visitedNodes = 0;
  
  // Thêm previousNode để làm "sợi chỉ Ariadne" truy ngược đường đi lúc kết thúc
  let grid = baseGrid.map(row => row.map(n => ({...n, isVisited: false, previousNode: null})));

  const startCalc = performance.now();

  while (stack.length > 0) {
    const current = stack.pop();
    const { r, c, cost } = current;
    
    if (grid[r][c].isVisited) continue;
    
    grid[r][c].isVisited = true;
    visitedNodes++;
    // Cập nhật lên UI đúng chi phí thực tế thay vì hardcode 0
    updateStats({ visited: visitedNodes, cost: cost, status: 'Đang chạy...', time: (performance.now() - startTime).toFixed(2) });
    
    // UI DOM updates removed from core algorithm

    // KHI TÌM THẤY ĐÍCH
    if (r === endNode.r && c === endNode.c) {
      const finalPath = [];
      let pathCost = 0;
      
      // Dò ngược từ Đích về Start dựa vào previousNode
      let traceR = r;
      let traceC = c;
      while (traceR !== startNode.r || traceC !== startNode.c) {
          finalPath.unshift({r: traceR, c: traceC});
          pathCost += grid[traceR][traceC].weight;
          const prev = grid[traceR][traceC].previousNode;
          traceR = prev.r;
          traceC = prev.c;
      }
      finalPath.unshift({r: startNode.r, c: startNode.c});

      const endCalc = performance.now();
      const calcTime = (endCalc - startCalc).toFixed(3);
      const elapsed = (performance.now() - startTime).toFixed(2);
      updateStats({ visited: visitedNodes, cost: pathCost, status: 'Hoàn thành', time: elapsed });
      // Trả về đúng object nguyên bản UI cần
      return { path: finalPath, cost: pathCost, time: elapsed, calcTime };
    }
    
    const neighbors = getNeighbors(grid, r, c);
    let unvisitedCount = 0;
    
    // Duyệt ngược mảng kề để đúng bản chất Stack (LIFO)
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const n = neighbors[i];
      if (!grid[n.r][n.c].isVisited) {
        const nextCost = cost + grid[n.r][n.c].weight;
        
        // Đánh dấu vết để lúc chạm đích còn biết đường mò về
        grid[n.r][n.c].previousNode = { r, c }; 
        
        stack.push({ r: n.r, c: n.c, cost: nextCost });
        
        // UI DOM update removed
        unvisitedCount++;
      }
    }
    
    // No UI backtrack visuals in core algorithm
  }
  
  return null;
};