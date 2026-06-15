# usePathfinding Hook — Trái tim của ứng dụng

**File**: `src/hooks/usePathfinding.js`

Đây là custom hook duy nhất của ứng dụng, đảm nhiệm toàn bộ state management và orchestration.

## Khởi tạo State

```js
const [baseGrid, setBaseGrid] = useState(createInitialGrid());   // Grid 15×20
const [startNode, setStartNode] = useState({ r: 7, c: 3 });     // Start ở bên trái
const [endNode, setEndNode] = useState({ r: 7, c: 16 });        // End ở bên phải
const [isRunning, setIsRunning] = useState(false);
const [isPaused, setIsPaused] = useState(false);
const [speed, setSpeed] = useState(50);                          // 50% mặc định

const [stats, setStats] = useState({
  dfs: { visited: 0, cost: 0, status: 'Sẵn sàng' },
  bfs: { visited: 0, cost: 0, status: 'Sẵn sàng' },
  dijkstra: { visited: 0, cost: 0, status: 'Sẵn sàng' },
  astar: { visited: 0, cost: 0, status: 'Sẵn sàng' },
});
```

---

## Refs — Performance critical

```js
const speedRef = useRef(100);
const pauseRef = useRef(false);
const resolvePauseRef = useRef([]);
const stopRef = useRef(false);
```

### Tại sao dùng ref thay vì state?

| Ref | Vấn đề với useState | Giải pháp với useRef |
|---|---|---|
| `speedRef` | setSpeed gây re-render toàn bộ mỗi lần kéo slider | Đọc trực tiếp giá trị trong `sleep()` mà không gây re-render |
| `pauseRef` | isPaused cần cập nhật ngay lập tức trong vòng lặp `while` | Check boolean mà không cần chờ React batch update |
| `resolvePauseRef` | Lưu mảng Promise resolve function — không liên quan đến UI | Ref cho phép lưu function reference |
| `stopRef` | Cần dừng ngay lập tức khi user nhấn Clear | Cờ boolean check được trong mọi vòng lặp |

---

## Hàm updateSpeed

```js
const updateSpeed = (val) => {
  setSpeed(val);
  speedRef.current = 200 - (val * 1.9);
};
```

- `setSpeed(val)` — cập nhật UI (hiển thị %)
- `speedRef.current = 200 - (val * 1.9)` — chuyển đổi % thành ms delay:
  - 1% → ~198ms (chậm)
  - 50% → ~105ms
  - 100% → ~10ms (nhanh)

---

## Hàm togglePause

```js
const togglePause = () => {
  setIsPaused(prev => {
    const next = !prev;
    pauseRef.current = next;
    if (!next && resolvePauseRef.current.length > 0) {
      resolvePauseRef.current.forEach(resolve => resolve());
      resolvePauseRef.current = [];
    }
    return next;
  });
};
```

Khi **pause**: set `pauseRef = true` → các `sleep()` sẽ đợi Promise
Khi **resume**:
- Gọi tất cả resolve functions trong `resolvePauseRef`
- Giải phóng tất cả các Promise đang chờ → 4 thuật toán tiếp tục đồng thời

---

## Hàm sleep — Cốt lõi của animation control

```js
const sleep = async () => {
  if (stopRef.current) throw new Error('CANCELLED');   // Check dừng
  if (pauseRef.current) {
    await new Promise(res => resolvePauseRef.current.push(res));  // Đợi resume
    if (stopRef.current) throw new Error('CANCELLED');            // Check lại sau resume
  }
  return new Promise(res => setTimeout(res, speedRef.current));   // Delay animation
};
```

### Luồng hoạt động

```
sleep() called
  │
  ├── stopRef? → throw 'CANCELLED' (Promise.all catch → thoát)
  │
  ├── pauseRef? 
  │     └── await new Promise(res => resolvePauseRef.push(res))
  │           └── ĐỢI đến khi togglePause() gọi resolve
  │           └── Sau resume: check stopRef lại
  │
  └── await setTimeout(speedRef.current) — delay animation
```

---

## Hàm startAlgorithms

```js
const startAlgorithms = async () => {
  if (isRunning) return;     // Chặn double-click
  stopRef.current = false;   // Reset stop
  resetDOMGrids();           // Xóa DOM cũ
  // Reset stats
  setIsRunning(true);
  setIsPaused(false);
  pauseRef.current = false;

  // Định nghĩa animatePath + updateStat (closure)
  
  const runAlgo = async (algoId, runFunc) => {
    try {
      const result = await runFunc(algoId, baseGrid, startNode, endNode, sleep, updateStat(algoId));
      if (stopRef.current) return;
      if (result && result.path) {
        await animatePath(algoId, result.path, result.cost);
      } else {
        updateStat(algoId)({ status: 'Không tìm thấy' });
      }
    } catch (e) {
      if (e.message !== 'CANCELLED') console.error(e);
    }
  };

  try {
    await Promise.all([
      runAlgo('dfs', runDFS),
      runAlgo('bfs', runBFS),
      runAlgo('dijkstra', runDijkstra),
      runAlgo('astar', runAStar),
    ]);
  } catch (e) {
    if (e.message !== 'CANCELLED') console.error(e);
  }

  if (!stopRef.current) setIsRunning(false);
};
```

### Promise.all — Parallel execution

4 thuật toán chạy song song, chia sẻ:
- Cùng `baseGrid` (mỗi thuật toán clone riêng)
- Cùng `sleep()` function → đồng bộ pause/resume
- Cùng `stopRef` → dừng đồng loạt

Nếu một thuật toán throw `CANCELLED`, Promise.all sẽ reject ngay → tất cả dừng.

---

## Hàm clearPath

```js
const clearPath = useCallback(() => {
  stopRef.current = true;               // Dừng thuật toán
  if (resolvePauseRef.current.length > 0) {
    resolvePauseRef.current.forEach(resolve => resolve());  // Giải phóng pause
    resolvePauseRef.current = [];
  }
  resetDOMGrids();                      // Xóa DOM classes
  setStats(/* reset về Sẵn sàng */);
  pauseRef.current = false;
  setIsPaused(false);
  setIsRunning(false);
}, []);
```

Dùng `useCallback` vì function này được truyền xuống `ControlPanel` → tránh re-render không cần thiết.

---

## Tổng kết luồng

```
User nhấn Run
  │
  ├─► startAlgorithms()
  │     ├─ resetDOMGrids() — xóa DOM
  │     ├─ setIsRunning(true)
  │     └─ Promise.all([DFS, BFS, Dijkstra, A*])
  │           │
  │           ├─ Mỗi bước: updateNodeDOM() — DOM trực tiếp
  │           ├─ Mỗi bước: updateStat() — React state
  │           └─ Mỗi bước: sleep() — delay + pause/stop check
  │           │
  │           ├─ Tìm thấy → animatePath()
  │           └─ Không tìm → status 'Không tìm thấy'
  │
  └─► setIsRunning(false)
```
