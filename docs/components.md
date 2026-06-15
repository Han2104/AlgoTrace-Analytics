# Components — Phân tích chi tiết

## 1. Board

**File**: `src/components/Board/Board.jsx`

### Props

| Prop | Kiểu | Mô tả |
|---|---|---|
| `algoId` | string | 'dfs'\|'bfs'\|'dijkstra'\|'astar' |
| `baseGrid` | Array | Grid dùng chung |
| `startNode` | `{r, c}` | Vị trí start |
| `endNode` | `{r, c}` | Vị trí end |
| `setBaseGrid` | function | Cập nhật grid |
| `setStartNode` | function | Di chuyển start |
| `setEndNode` | function | Di chuyển end |
| `isRunning` | boolean | Khóa tương tác |

### Logic tương tác chuột

```js
const isMouseDown = useRef(false);   // Trạng thái đang giữ chuột?
const draggedNode = useRef(null);    // 'start' | 'end' | null
```

**Mouse down** (`handleMouseDown`, line 8):
- Nếu click vào **start node** → chế độ kéo thả start
- Nếu click vào **end node** → chế độ kéo thả end
- Nếu click vào **ô khác** → toggle wall (`toggleWall`)

**Mouse enter** (`handleMouseEnter`, line 21):
- Nếu đang kéo start → cập nhật `startNode`
- Nếu đang kéo end → cập nhật `endNode`
- Nếu đang vẽ wall → toggle wall tại ô đó

**Mouse up / Leave** (`handleMouseUp`, line 36):
- Reset refs

### toggleWall (line 41)

```js
const toggleWall = (r, c) => {
  setBaseGrid(prev => {
    const newGrid = [...prev];
    newGrid[r] = [...newGrid[r]];
    const node = newGrid[r][c];
    if (node.weight > 1) node.weight = 1;  // Reset weight nếu đang là weighted
    node.isWall = !node.isWall;            // Toggle wall
    return newGrid;
  });
};
```

- Clone grid bất biến (immutable) cho React state
- Nếu node đang là weighted (weight > 1), reset về 1
- Toggle isWall

### Render

```jsx
<div className="grid" style={{
  gridTemplateColumns: `repeat(${COLS}, 20px)`,
  gridTemplateRows: `repeat(${ROWS}, 20px)`
}}>
  {baseGrid.map((row, r) =>
    row.map((node, c) => (
      <Node key={`${algoId}-${r}-${c}`} ... />
    ))
  )}
</div>
```

- CSS Grid layout cố định 20px × 20px mỗi ô
- 15 rows × 20 cols = 300 Node components

---

## 2. Node

**File**: `src/components/Board/Node.jsx`

### Props

| Prop | Mô tả |
|---|---|
| `id` | DOM id format: `node-{algoId}-{r}-{c}` |
| `isWall` | Boolean — tường? |
| `isStart` | Boolean — điểm bắt đầu? |
| `isEnd` | Boolean — điểm kết thúc? |
| `weight` | Number — trọng số (mặc định 1) |
| `onMouseDown/Enter/Up` | Event handlers |

### Logic CSS class

```js
let extraClass = '';
if (isStart) extraClass = 'start';
else if (isEnd) extraClass = 'end';
else if (isWall) extraClass = 'wall';
else if (weight > 1) extraClass = `weight-${weight}`;
```

- Ưu tiên: start > end > wall > weight
- Weight hiển thị số ở giữa ô nếu > 1

### React.memo

```js
export const Node = memo(({ ... }) => { ... });
```

- Ngăn re-render khi parent Board re-render nhưng props của Node không thay đổi

---

## 3. ControlPanel

**File**: `src/components/ControlPanel/ControlPanel.jsx`

### Props

| Prop | Mô tả |
|---|---|
| `speed` | Number 1-100 (tốc độ %) |
| `updateSpeed` | Function cập nhật speed |
| `isRunning` | Boolean |
| `isPaused` | Boolean |
| `togglePause` | Function |
| `startAlgorithms` | Function |
| `clearPath` | Function |
| `setBaseGrid` | Function |
| `startNode` | `{r, c}` |
| `endNode` | `{r, c}` |

### Cấu trúc giao diện

```
┌─────────────────────────────┐
│         AlgoTrace           │
│  Chạy song song 4 thuật toán │
│  Tốc độ: [=====●====] 50%   │
│  ┌──────┬──────┬──────┬────┐│
│  │ Chạy │T.Dừng│ Xóa  │Xóa ││
│  │      │      │Đường │Bảng││
│  └──────┴──────┴──────┴────┘│
│  ─── Kịch bản bài toán ───  │
│  [Mê cung] [Ngẫu nhiên]     │
│  [Mạng XH] [Định tuyến]     │
│  [Kho hàng] [A*][Dijkstra]  │
│  ─── Chú giải ───           │
│  ■ Chưa duyệt               │
│  ■ Đang chờ                 │
│  ■ Đã duyệt                 │
│  ■ Đường đi                 │
│  ■ Vật cản                  │
│  ■ Rút lui (DFS)            │
│  ─── Hướng dẫn ───          │
│  Kéo thả điểm...            │
└─────────────────────────────┘
```

### Buttons

| Button | Class | Hành động |
|---|---|---|
| Chạy | `primary` | Gọi `startAlgorithms()`, disabled khi đang chạy |
| Tạm Dừng / Tiếp tục | `warning` | Gọi `togglePause()`, disabled khi không chạy |
| Xóa Đường Đi | `secondary` | Gọi `clearPath()` |
| Xóa Bảng | `danger` | Gọi `clearBoard()` |

### Scenarios

7 nút kịch bản (xem chi tiết tại [scenarios.md](./scenarios.md)):
- Mê cung (Thật) — `maze`
- Bản đồ Ngẫu nhiên — `random`
- Mạng xã hội (Trống) — `social`
- Định tuyến (Trọng số) — `traffic`
- Kho hàng (Vật cản) — `warehouse`
- **Ưu thế A*** — `efficiency` (nổi bật xanh)
- **Ưu thế Dijkstra** — `cost_battle` (nổi bật xanh)

### clearBoard (line 139)

```js
const clearBoard = () => {
  clearPath();                               // Xóa đường + dừng
  setBaseGrid(prev => {
    const newGrid = [...prev];
    for (let r = 0; r < ROWS; r++) {
      newGrid[r] = [...newGrid[r]];
      for (let c = 0; c < COLS; c++) {
        newGrid[r][c].isWall = false;         // Xóa wall
        newGrid[r][c].weight = 1;             // Reset weight
      }
    }
    return newGrid;
  });
};
```

---

## 4. MiniDashboard

**File**: `src/components/Dashboard/MiniDashboard.jsx`

### Props

| Prop | Mô tả |
|---|---|
| `title` | string — tên hiển thị (VD: "DFS (Quay lui)") |
| `stats` | `{visited, cost, status}` |

### Render

```jsx
<div className="mini-dashboard">
  <div className="algo-title">DFS (Quay lui)</div>
  <div className="stat-item">Nút duyệt: <span>0</span></div>
  <div className="stat-item">Chi phí: <span>0</span></div>
  <div className="stat-item">Trạng thái: <span>Sẵn sàng</span></div>
</div>
```

### Các trạng thái

| `stats.status` | Ý nghĩa |
|---|---|
| `'Sẵn sàng'` | Chưa chạy / đã xóa |
| `'Đang chạy...'` | Đang thực thi |
| `'Hoàn thành'` | Tìm thấy đường |
| `'Không tìm thấy'` | Không có đường đến đích |
