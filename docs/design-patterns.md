# Design Patterns & Performance Optimizations

## 1. Direct DOM Manipulation (Bypass React)

**Vấn đề**: 4 thuật toán chạy song song, mỗi bước cập nhật màu sắc của 1 trong 300 nodes. Nếu dùng React setState để re-render, mỗi bước sẽ trigger:
- React reconciliation
- So sánh virtual DOM
- Re-render component tree

Với animation ~50-100 bước × 4 algorithms, React không đáp ứng kịp.

**Giải pháp**: `updateNodeDOM()` trong `src/utils/boardUtils.js`

```js
export const updateNodeDOM = (algoId, r, c, classesToAdd, classesToRemove = [], htmlContent = null) => {
  const el = document.getElementById(`node-${algoId}-${r}-${c}`);
  if (el) {
    if (classesToRemove.length) el.classList.remove(...classesToRemove);
    if (classesToAdd.length) el.classList.add(...classesToAdd);
    if (htmlContent !== null) el.innerHTML = htmlContent;
  }
};
```

- Dùng `document.getElementById()` truy cập trực tiếp DOM element
- Thay đổi `classList` — thao tác cực nhanh, không qua React
- `innerHTML` cho cost text (Dijkstra, A*)
- ID format: `node-{algoId}-{r}-{c}` — unique cho mỗi algorithm

**Kết quả**: Hàng nghìn cập nhật DOM mượt mà.

---

## 2. Ref-based Cancellation Pattern

**Vấn đề**: Khi user nhấn "Xóa đường đi", cần dừng tất cả 4 async functions đang chạy, thoát khỏi vòng lặp while, và không tiếp tục animation.

**Giải pháp**: `stopRef` — cờ boolean shared giữa hook và các thuật toán.

```js
// usePathfinding.js
const stopRef = useRef(false);

// Trong startAlgorithms(), mỗi bước:
const runAlgo = async (algoId, runFunc) => {
  try {
    const result = await runFunc(/* shared sleep function */);
    if (stopRef.current) return;  // Check sau khi hoàn thành
  } catch (e) {
    if (e.message !== 'CANCELLED') console.error(e);
  }
};

// Trong sleep()
if (stopRef.current) throw new Error('CANCELLED');
```

**Luồng stop**:
1. User click "Xóa đường đi"
2. `clearPath()` set `stopRef.current = true`
3. Các `sleep()` đang chờ sẽ throw 'CANCELLED'
4. Các `runAlgo` catch 'CANCELLED' và return
5. `Promise.all` cũng catch
6. UI reset về trạng thái ban đầu

---

## 3. Promise-based Pause/Resume

**Vấn đề**: Tạm dừng 4 async functions đang chạy song song và tiếp tục đồng thời.

**Giải pháp**:

```js
// Pause: tạo Promise và lưu resolve function
const resolvePauseRef = useRef([]);

// Trong sleep():
if (pauseRef.current) {
  await new Promise(res => resolvePauseRef.current.push(res));
  // Đợi đến khi resume gọi resolve
}

// Resume:
if (!next && resolvePauseRef.current.length > 0) {
  resolvePauseRef.current.forEach(resolve => resolve());
  resolvePauseRef.current = [];
}
```

**Cách hoạt động**:
1. Pause: mỗi `sleep()` tạo Promise mới, `resolve` được lưu vào mảng
2. Tất cả 4 thuật toán đều đợi tại `await new Promise(...)`
3. Resume: gọi tất cả `resolve` trong mảng → tất cả Promise hoàn thành đồng thời
4. Cả 4 thuật toán tiếp tục chạy song song

---

## 4. Ref vs State Strategy

| Dữ liệu | Dùng | Lý do |
|---|---|---|
| Grid, start, end, running, paused, speed %, stats | `useState` | Cần re-render UI khi thay đổi |
| Speed delay (ms) | `useRef` | Chỉ dùng trong sleep(), không cần re-render |
| Pause flag | `useRef` | Check trong hot loop, cần tức thời |
| Resolve functions | `useRef` | Không liên quan đến rendering |
| Stop flag | `useRef` | Cần tức thời, read từ nhiều async context |

**Nguyên tắc**: Nếu dữ liệu chỉ cần trong logic async (không ảnh hưởng UI) → `useRef`. Nếu dữ liệu ảnh hưởng UI → `useState`.

---

## 5. Parallel Algorithm Execution

```js
await Promise.all([
  runAlgo('dfs', runDFS),
  runAlgo('bfs', runBFS),
  runAlgo('dijkstra', runDijkstra),
  runAlgo('astar', runAStar),
]);
```

- JavaScript event loop xử lý 4 async functions đồng thời (cooperative concurrency)
- Mỗi `await sleep()` là cơ hội để event loop chuyển sang function khác
- Kết quả: 4 animation chạy cạnh nhau, từng bước một xen kẽ

---

## 6. Immutable State Updates

Board component clone grid immutable để React phát hiện thay đổi:

```js
const toggleWall = (r, c) => {
  setBaseGrid(prev => {
    const newGrid = [...prev];       // Clone array cấp 1
    newGrid[r] = [...newGrid[r]];    // Clone row
    const node = newGrid[r][c];
    node.isWall = !node.isWall;      // Mutate (trong clone mới)
    return newGrid;
  });
};
```

Tương tự trong `loadScenario`:
```js
setBaseGrid(prev => {
  const newGrid = prev.map(row => row.map(node => ({ ...node, isWall: false, weight: 1 })));
  // modify newGrid...
  return newGrid;
});
```

---

## 7. React.memo cho Node

```js
export const Node = memo(({ id, isWall, isStart, isEnd, weight, onMouseDown, onMouseEnter, onMouseUp }) => {
  // ...
});
```

- 300 Node components trong mỗi Board (4 Board = 1200 nodes)
- Khi Board re-render (do setBaseGrid), chỉ Node nào thay đổi props mới re-render
- Props đơn giản (boolean, number) → shallow compare của memo hiệu quả

---

## 8. CSS Custom Properties (Variables)

```css
:root {
  --cell-visited: rgba(57, 255, 20, 0.15);
  --cell-path: #39ff14;
  --cell-wall: #50588e;
  /* ... */
}
```

- Dark theme với neon accents
- Dễ maintain — thay đổi màu sắc ở một chỗ
- Tận dụng CSS class toggling cho animation states
- Wall nodes có hiệu ứng 3D nhờ `box-shadow` + `translateY(-2px)`

---

## 9. Architecture Pattern: Hook-based Orchestration

```
┌─────────────────────────────────────────────────┐
│                    App.jsx                       │
│  (Pure composition — không logic, chỉ render)    │
└──────────────┬─────────────────────┬─────────────┘
               │                     │
               ▼                     ▼
┌─────────────────────────┐ ┌─────────────────────┐
│    usePathfinding()     │ │     Components       │
│  (All state + logic)    │ │   (Dumb/presentational) │
│  - Grid management      │ │   - Board            │
│  - Algorithm execution  │ │   - Node             │
│  - Animation control    │ │   - ControlPanel     │
│  - Stats tracking       │ │   - MiniDashboard    │
│  - Pause/Resume/Stop    │ │                      │
└─────────────────────────┘ └─────────────────────┘
```

- **Separation of concerns**: Hook xử lý logic, Components chỉ render
- **Reusability**: Có thể dùng usePathfinding với UI framework khác
- **Testability**: Logic độc lập với UI
