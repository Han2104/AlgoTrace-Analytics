# Thuật toán — Phân tích chi tiết

Tất cả 4 thuật toán có chung interface:

```js
async function runAlgo(algoId, baseGrid, startNode, endNode, sleep, updateStats)
```

- `algoId` — định danh DOM ('dfs'|'bfs'|'dijkstra'|'astar')
- `baseGrid` — grid gốc (clone nội bộ để tránh mutation)
- `startNode`/`endNode` — `{r, c}`
- `sleep` — async function kiểm soát tốc độ + pause/stop
- `updateStats` — function cập nhật visited/cost/status cho dashboard
- **Return** `{path: [{r,c}], cost: number}` hoặc `null` nếu không tìm thấy

---

## 1. DFS — Depth-First Search (Quay lui)

**File**: `src/algorithms/dfs.js`

```js
// Stack (LIFO) — mô phỏng đệ quy
let stack = [{ r: startNode.r, c: startNode.c, path: [], cost: 0 }];
let grid = baseGrid.map(row => row.map(n => ({...n, isVisited: false})));
```

### Đặc điểm
- Dùng **Stack** (mảng JS với `push`/`pop`)
- Khám phá theo chiều sâu — đi đến khi dead-end rồi quay lui
- Hiển thị backtrack: node dead-end chuyển sang màu xám (`backtrack` class)

### Logic từng bước
```
1. Pop node từ stack (LIFO → node mới nhất)
2. Nếu đã visited → skip
3. Đánh dấu visited, tăng visitedNodes, cập nhật DOM (class 'visited')
4. Nếu là đích → return {path, cost}
5. Lấy neighbors không phải wall, chưa visited
6. Push neighbors vào stack theo thứ tự NGƯỢC (từ phải sang trái)
   → để duyệt theo thứ tự tự nhiên (trái→phải)
7. Với mỗi neighbor chưa visited: tô màu 'processing' (chờ xử lý)
8. Nếu không có neighbor nào chưa visited → node là dead-end
   → tô màu 'backtrack' (quay lui) và await sleep
9. await sleep() → pause/stop check
```

### Code highlight

```js
// Backtrack visualization
if (unvisitedCount === 0 && (r !== startNode.r || c !== startNode.c)) {
  updateNodeDOM(algoId, r, c, ['backtrack'], ['visited']);
  await sleep();
}
```

---

## 2. BFS — Breadth-First Search (Loang)

**File**: `src/algorithms/bfs.js`

```js
// Queue (FIFO)
let queue = [{ r: startNode.r, c: startNode.c, path: [], cost: 0 }];
let grid = baseGrid.map(row => row.map(n => ({...n, isVisited: false})));
grid[startNode.r][startNode.c].isVisited = true;
```

### Đặc điểm
- Dùng **Queue** (mảng JS với `push`/`shift`)
- Khám phá theo chiều rộng — lan tỏa đều ra xung quanh
- **Đảm bảo đường đi ngắn nhất** (trong đồ thị không trọng số)
- Cost tích lũy weight của các node (dù BFS không dùng cost để quyết định)

### Logic từng bước
```
1. Đánh dấu startNode visited NGAY từ đầu (tránh xử lý lại)
2. Shift node từ queue (FIFO → node cũ nhất)
3. Tăng visitedNodes, cập nhật DOM
4. Nếu là đích → return {path, cost}
5. Lấy neighbors (không wall, chưa visited)
6. Với mỗi neighbor:
   - Đánh dấu visited NGAY (tránh duplicate trong queue)
   - Push vào queue với path mới
   - Tô màu 'processing'
7. await sleep()
```

### Điểm khác BFS vs DFS
- BFS: đánh dấu visited ngay khi thêm vào queue → không duplicate
- DFS: đánh dấu visited khi pop khỏi stack → tiết kiệm visited check

---

## 3. Dijkstra — Thuật toán đường đi ngắn nhất

**File**: `src/algorithms/dijkstra.js`

```js
// Priority Queue (sắp xếp theo cost)
let pq = [{ r: startNode.r, c: startNode.c, cost: 0, path: [] }];
let dist = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
dist[startNode.r][startNode.c] = 0;
```

### Đặc điểm
- Dùng **Priority Queue** (mảng sắp xếp theo cost mỗi lần lặp)
- Tìm đường đi **tối ưu** dựa trên **chi phí (weight)**
- **Hiển thị cost** trên mỗi node đã duyệt (số nhỏ màu đen)

### Logic từng bước
```
1. Sắp xếp queue theo cost tăng dần (pq.sort())
   → O(n log n) mỗi lần — đơn giản nhưng đủ dùng
2. Shift node có cost thấp nhất
3. Nếu visited → skip (có thể có duplicate với cost cao hơn)
4. Đánh dấu visited, tăng visitedNodes
5. Cập nhật DOM với cost text (HTML inline)
6. Nếu là đích → return {path, cost}
7. Với mỗi neighbor:
   - Tính altCost = current.cost + neighbor.weight
   - Nếu altCost < dist[neighbor] → cập nhật và push vào queue
8. await sleep()
```

### Cost display

```js
// Dijkstra hiển thị cost trên mỗi node
if (r !== endNode.r || c !== endNode.c) {
  html = `<span class="cost-text" style="font-size: 8px;">${cost}</span>`;
}
updateNodeDOM(algoId, r, c, ['visited'], ['processing'], html);
```

---

## 4. A* — Heuristic Search

**File**: `src/algorithms/astar.js`, `src/utils/heuristics.js`

```js
// Priority Queue (sắp xếp theo f = g + h)
let pq = [{ r: startNode.r, c: startNode.c, g: 0, h: 0, f: 0, path: [] }];
let gScore = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
gScore[startNode.r][startNode.c] = 0;
```

### Đặc điểm
- Dùng **Priority Queue** (sắp xếp theo f-score)
- Kết hợp chi phí thực tế (g) + heuristic (h)
- Heuristic: **Manhattan distance × 10**
- **Hiển thị f(n) và g(n)** trên mỗi node

### Heuristic

**File**: `src/utils/heuristics.js`

```js
export const manhattanDistance = (r1, c1, r2, c2) => {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2);
};
```

Trong A*, heuristic được nhân với 10:
```js
const h = manhattanDistance(n.r, n.c, endNode.r, endNode.c) * 10;
```

### Logic từng bước
```
1. Sắp xếp queue theo f = g + h (pq.sort())
2. Shift node có f thấp nhất
3. Nếu visited → skip
4. Đánh dấu visited, tăng visitedNodes
5. Cập nhật DOM với f và g text (nhỏ hơn, 2 dòng)
6. Nếu là đích → return {path, cost: g}
7. Với mỗi neighbor:
   - Tính tentativeG = current.g + neighbor.weight
   - Nếu tentativeG < gScore[neighbor]:
     - Cập nhật gScore
     - Tính h = manhattanDistance × 10
     - Tính f = tentativeG + h
     - Push vào queue
8. await sleep()
```

### So sánh visited nodes

A* thường duyệt ít node hơn Dijkstra/BFS nhờ heuristic dẫn hướng về phía đích.

---

## Bảng so sánh

| Thuật toán | Cấu trúc | Ưu điểm | Nhược điểm | Hiển thị thêm |
|---|---|---|---|---|
| DFS | Stack (LIFO) | Backtrack trực quan, dễ hiểu | Không đảm bảo đường ngắn nhất | Backtrack (màu xám) |
| BFS | Queue (FIFO) | Đường ngắn nhất (unweighted) | Không tối ưu cost | — |
| Dijkstra | Priority Queue (cost) | Tối ưu cost tuyệt đối | Chậm, lan tỏa đều mọi hướng | Cost trên node |
| A* | Priority Queue (f=g+h) | Nhanh, ít visited nhất | Heuristic không chính xác (overestimate) | f(n), g(n) trên node |

---

## Path Animation

Sau khi thuật toán tìm được đường, `animatePath()` được gọi (trong `usePathfinding.js:87`):

```js
const animatePath = async (algoId, path, cost) => {
  setStats(prev => ({ ...prev, [algoId]: { ...prev[algoId], cost, status: 'Hoàn thành' } }));
  for (let i = path.length - 2; i > 0; i--) {
    if (stopRef.current) return;
    updateNodeDOM(algoId, path[i].r, path[i].c, ['path']);
    await sleep();
  }
};
```

- Duyệt path từ **cuối lên đầu** (trừ start/end)
- Tô màu 'path' (xanh neon `#39ff14`)
- Mỗi bước có sleep để tạo hiệu ứng chạy dần
- Nếu stop → dừng ngay
