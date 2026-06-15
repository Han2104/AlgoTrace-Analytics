/**
 * =====================================================
 *  KÍCH THƯỚC LƯỚI
 *  =====================================================
 *  ROWS = 15  (hàng, đánh số từ 0..14)
 *  COLS = 20  (cột, đánh số từ 0..19)
 *  Tổng số ô: 15 × 20 = 300 ô / board
 *  Vì có 4 board (DFS, BFS, Dijkstra, A*)
 *  → 300 × 4 = 1200 ô DOM trên trang.
 */
export const ROWS = 15;
export const COLS = 20;

/**
 * =====================================================
 *  createInitialGrid()
 *  =====================================================
 *  Tạo grid 2D (mảng lồng mảng) với tất cả ô ở trạng thái
 *  mặc định: không phải tường (isWall = false), trọng số 1.
 *
 *  Cấu trúc mỗi ô (node):
 *    { r: number,            // chỉ số hàng
 *      c: number,            // chỉ số cột
 *      isWall: boolean,      // true = vật cản (không đi qua được)
 *      weight: number        // chi phí đi qua ô này (mặc định 1)
 *    }
 *
 *  Grid mặc định dùng cho toàn bộ ứng dụng (baseGrid).
 *  Các thuật toán sẽ CLONE grid này (thêm trường isVisited)
 *  để không làm ảnh hưởng lẫn nhau.
 */
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

/**
 * =====================================================
 *  getNeighbors()
 *  =====================================================
 *  Trả về danh sách các ô lân cận (hàng xóm) hợp lệ của
 *  ô (r, c). Thứ tự: LÊN → PHẢI → XUỐNG → TRÁI.
 *
 *  @param {Array} grid  - Grid 2D đang dùng
 *  @param {number} r    - Hàng của ô hiện tại
 *  @param {number} c    - Cột của ô hiện tại
 *  @returns {Array}     - Mảng các ô lân cận KHÔNG phải tường
 *
 *  Lưu ý: Chỉ lọc isWall, KHÔNG kiểm tra visited.
 *  Việc kiểm tra visited do từng thuật toán tự xử lý.
 */
export const getNeighbors = (grid, r, c) => {
  const neighbors = [];
  if (r > 0) neighbors.push(grid[r - 1][c]);
  if (c < COLS - 1) neighbors.push(grid[r][c + 1]);
  if (r < ROWS - 1) neighbors.push(grid[r + 1][c]);
  if (c > 0) neighbors.push(grid[r][c - 1]);
  return neighbors.filter(n => !n.isWall);
};

/**
 * =====================================================
 *  updateNodeDOM()
 *  =====================================================
 *  Cập nhật màu sắc + nội dung của một ô trên giao diện
 *  bằng cách thao tác TRỰC TIẾP với DOM (bỏ qua React).
 *
 *  Đây là "cầu nối" giữa thuật toán và đồ họa.
 *  Khi thuật toán duyệt một node, nó gọi hàm này để
 *  tô màu node đó trên màn hình.
 *
 *  TẠI SAO DÙNG DOM TRỰC TIẾP THAY VÌ REACT STATE?
 *  - 4 thuật toán chạy song song, mỗi bước cập nhật 1 ô
 *  - Nếu setState → React re-render → quá chậm cho animation
 *  - Dùng classList.add/remove trực tiếp → cực nhanh, không
 *    qua React reconciliation
 *
 *  ID format của mỗi ô DOM:
 *    `node-${algoId}-${r}-${c}`
 *    VD: node-dfs-5-10, node-astar-0-0
 *
 *  @param {string} algoId          - 'dfs'|'bfs'|'dijkstra'|'astar'
 *  @param {number} r               - Hàng
 *  @param {number} c               - Cột
 *  @param {string[]} classesToAdd  - Các class CSS để THÊM (VD: ['visited'])
 *  @param {string[]} classesToRemove - Các class CSS để XÓA (VD: ['processing'])
 *  @param {string|null} htmlContent - Nội dung HTML để chèn vào ô
 *                                      (Dijkstra hiển thị cost, A* hiển thị f/g)
 *
 *  Các class CSS (định nghĩa trong App.css):
 *    visited    → Màu xanh lá mờ (đã duyệt)
 *    processing → Màu trắng mờ (đang chờ trong queue/stack)
 *    path       → Màu xanh neon phát sáng (đường đi kết quả)
 *    backtrack  → Màu xám (dead-end, chỉ DFS)
 *
 *  VÍ DỤ gọi từ thuật toán DFS (dfs.js:24):
 *    updateNodeDOM(algoId, r, c, ['visited'], ['processing']);
 *    → Ô chuyển từ "đang chờ" (processing) sang "đã duyệt" (visited)
 */
export const updateNodeDOM = (algoId, r, c, classesToAdd, classesToRemove = [], htmlContent = null) => {
  const el = document.getElementById(`node-${algoId}-${r}-${c}`);
  if (el) {
    if (classesToRemove.length) el.classList.remove(...classesToRemove);
    if (classesToAdd.length) el.classList.add(...classesToAdd);
    if (htmlContent !== null) el.innerHTML = htmlContent;
  }
};

/**
 * =====================================================
 *  resetDOMGrids()
 *  =====================================================
 *  Xóa toàn bộ hiệu ứng animation khỏi tất cả các ô
 *  trên cả 4 board (DFS, BFS, Dijkstra, A*).
 *
 *  Được gọi khi:
 *    1. User nhấn "Xóa đường đi"
 *    2. User nhấn "Chạy" (reset trước khi chạy lại)
 *    3. User chọn kịch bản mới
 *
 *  Những gì bị xóa:
 *    - Class 'visited', 'processing', 'path', 'backtrack'
 *    - Thẻ <span> chứa cost text (do Dijkstra/A* chèn)
 *
 *  Những gì KHÔNG bị xóa:
 *    - Class 'wall' (tường vẫn giữ)
 *    - Class 'start', 'end' (điểm đầu/cuối vẫn giữ)
 *    - Class 'weight-*' (trọng số vẫn giữ)
 */
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
