# Kiến trúc & Luồng dữ liệu

## Component Hierarchy

```
<App>                          (src/App.jsx)
├── <ControlPanel>             (src/components/ControlPanel/ControlPanel.jsx)
│     Props: speed, updateSpeed, isRunning, isPaused,
│            togglePause, startAlgorithms, clearPath,
│            setBaseGrid, startNode, endNode
│
├── (×4 — dfs, bfs, dijkstra, astar)
│   ├── <MiniDashboard>        (src/components/Dashboard/MiniDashboard.jsx)
│   │     Props: title, stats[algoId]
│   │
│   └── <Board>                (src/components/Board/Board.jsx)
│         Props: algoId, baseGrid, startNode, endNode,
│                setBaseGrid, setStartNode, setEndNode, isRunning
│         │
│         └── <Node> × 300     (src/components/Board/Node.jsx)
│               Props: id, isWall, isStart, isEnd, weight,
│                      onMouseDown, onMouseEnter, onMouseUp
```

## Sơ đồ luồng dữ liệu

```
┌─────────────────────────────────────────────┐
│              usePathfinding()                │
│  (src/hooks/usePathfinding.js)              │
│                                              │
│  State:  baseGrid, startNode, endNode,       │
│          isRunning, isPaused, speed, stats    │
│  Ref:    speedRef, pauseRef,                 │
│          resolvePauseRef[], stopRef           │
│  Actions: startAlgorithms(), clearPath(),    │
│           togglePause(), updateSpeed()       │
└──────┬──────────────┬──────────────┬─────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────┐  ┌──────────────┐  ┌───────────┐
│ Controls │  │ Dashboard ×4 │  │ Board ×4  │
│ (input)  │  │ (read stats) │  │ (grid)    │
└──────────┘  └──────────────┘  └───────────┘
       │                              ▲
       │ setBaseGrid                   │ baseGrid (read)
       │ setStartNode                  │ startNode (read)
       │ setEndNode                    │ endNode (read)
       ▼                              │
 ┌──────────────────────────────────────────────────┐
 │  startAlgorithms()                                │
 │    ├─ Promise.all([                               │
 │    │   runDFS(   baseGrid, start, end, sleep,     │
 │    │              updateStat('dfs')),              │
 │    │   runBFS(   baseGrid, start, end, sleep,     │
 │    │              updateStat('bfs')),              │
 │    │   runDijkstra(baseGrid, start, end, sleep,   │
 │    │              updateStat('dijkstra')),         │
 │    │   runAStar( baseGrid, start, end, sleep,     │
 │    │              updateStat('astar'))             │
 │    │ ])                                            │
 │    └─ Mỗi thuật toán gọi:                          │
 │       • updateNodeDOM() — thay đổi classList DOM   │
 │       • updateStat()    — cập nhật stats (setState)│
 │       • sleep()         — kiểm tra pause/stop      │
 │    Kết thúc → animatePath() — tô màu đường đi      │
 └──────────────────────────────────────────────────┘
```

## State Management

### useState (UI-reactive)

| State | Kiểu | Mục đích |
|---|---|---|
| `baseGrid` | `Array<Array<{r, c, isWall, weight}>>` | Grid gốc (dùng chung cho 4 thuật toán) |
| `startNode` | `{r, c}` | Vị trí điểm bắt đầu |
| `endNode` | `{r, c}` | Vị trí điểm kết thúc |
| `isRunning` | `boolean` | Đang chạy thuật toán? |
| `isPaused` | `boolean` | Đang tạm dừng? |
| `speed` | `number` (1-100) | Tốc độ animation |
| `stats` | `{dfs, bfs, dijkstra, astar: {visited, cost, status}}` | Thống kê mỗi thuật toán |

### useRef (animation-critical)

| Ref | Mục đích |
|---|---|
| `speedRef` | Tránh re-render khi kéo slider (setState gây re-render toàn bộ) |
| `pauseRef` | Boolean tạm dừng — dùng trong `sleep()` để check không cần re-render |
| `resolvePauseRef[]` | Mảng các resolve function của Promise tạm dừng |
| `stopRef` | Cờ dừng — khi user nhấn "Xóa đường đi", thoát khỏi vòng lặp |

---

## Luồng Animation

1. User nhấn **Run**
2. `startAlgorithms()` được gọi → `isRunning = true`
3. `Promise.all([runDFS, runBFS, runDijkstra, runAStar])` — 4 thuật toán chạy đồng thời
4. Mỗi bước: thuật toán gọi `updateNodeDOM()` (DOM trực tiếp) + `updateStat()` (React state) + `sleep()` (chờ + kiểm tra pause/stop)
5. Khi một thuật toán tìm thấy đích → `animatePath()` tô màu đường đi từ đích về start
6. Khi cả 4 hoàn tất → `isRunning = false`

## Ghi chú

- **Không routing**: SPA một trang, không router
- **Không API server**: toàn bộ xử lý client-side
- **Không thư viện state ngoài**: chỉ dùng React useState + useRef
