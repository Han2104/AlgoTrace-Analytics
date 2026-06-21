export const ROWS = 47;
export const COLS = 64;

export const createInitialGrid = () => {
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push({
        r,
        c,
        isWall: false,
        weight: 1,
      });
    }
    grid.push(row);
  }
  return grid;
};

export const getNeighbors = (grid, r, c) => {
  const neighbors = [];
  if (r > 0) neighbors.push(grid[r - 1][c]);
  if (c < COLS - 1) neighbors.push(grid[r][c + 1]);
  if (r < ROWS - 1) neighbors.push(grid[r + 1][c]);
  if (c > 0) neighbors.push(grid[r][c - 1]);
  // Lưu ý: thứ tự neighbors ảnh hưởng đến mẫu khám phá (đặc biệt với DFS).
  // Lọc wall ngay từ đầu sẽ giảm khối lượng công việc cho các thuật toán.
  return neighbors.filter(n => !n.isWall);
};

// Global helper to update DOM classes directly to bypass React renders for animation speed
// Hàm helper toàn cục cập nhật class DOM trực tiếp để tăng tốc animation
// (bỏ qua việc render lại React khi cần tốc độ hiển thị cao).
export const updateNodeDOM = (algoId, r, c, classesToAdd, classesToRemove = [], htmlContent = null) => {
  const el = document.getElementById(`node-${algoId}-${r}-${c}`);
  if (el) {
    if (classesToRemove.length) el.classList.remove(...classesToRemove);
    if (classesToAdd.length) el.classList.add(...classesToAdd);
    if (htmlContent !== null) el.innerHTML = htmlContent;
  }
};

export const resetDOMGrids = () => {
  const algos = ['dfs', 'bfs', 'dijkstra', 'astar'];
  algos.forEach(algoId => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const el = document.getElementById(`node-${algoId}-${r}-${c}`);
        if (el) {
          el.classList.remove('visited', 'processing', 'path', 'backtrack');
          const span = el.querySelector('span[style]');
          if (span) span.remove();
        }
      }
    }
  });
};
