# AlgoTrace-Analytics — Tổng quan dự án

## Mô tả

**AlgoTrace-Analytics** là công cụ trực quan hóa và so sánh 4 thuật toán tìm đường (pathfinding) chạy song song trên cùng một bản đồ. Người dùng có thể tương tác với lưới ô vuông, vẽ vật cản, kéo thả điểm đầu/cuối, chọn các kịch bản topology khác nhau, và quan sát trực tiếp cách mỗi thuật toán hoạt động.

Demo độc lập: `maze-demo.html` — mê cung 3D neon trên Canvas.

---

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Framework UI | React 18 |
| Bundler | Vite 5 |
| Icons | lucide-react |
| Ngôn ngữ | JavaScript (JSX) |
| Styling | CSS thuần (CSS Variables, dark theme) |
| Build tool | @vitejs/plugin-react |

---

## Cấu trúc thư mục

```
AlgoTrace-Analytics/
├── index.html              # Entry point SPA
├── maze-demo.html          # Mê cung 3D neon độc lập
├── package.json            # Cấu hình npm
├── vite.config.js          # Cấu hình Vite
│
├── src/                    # (React App — ĐANG SỬ DỤNG)
│   ├── main.jsx            # Entry point React
│   ├── App.jsx             # Root component (layout 2x2)
│   ├── App.css             # Toàn bộ styles (dark theme)
│   │
│   ├── hooks/
│   │   └── usePathfinding.js   # Hook orchestration chính
│   │
│   ├── algorithms/
│   │   ├── bfs.js           # Breadth-First Search
│   │   ├── dfs.js           # Depth-First Search
│   │   ├── dijkstra.js      # Dijkstra's Algorithm
│   │   └── astar.js         # A* Search
│   │
│   ├── utils/
│   │   ├── boardUtils.js    # Grid utilities + DOM helpers
│   │   └── heuristics.js    # Manhattan distance
│   │
│   └── components/
│       ├── Board/Board.jsx          # Grid container
│       ├── Board/Node.jsx           # Single cell (memoized)
│       ├── ControlPanel/ControlPanel.jsx  # Sidebar controls
│       └── Dashboard/MiniDashboard.jsx    # Per-algo status bar
│
├── js/                      # (Legacy — phiên bản cũ)
│   ├── main.js, globals.js, grid.js
│   └── algorithms/ (bfs, dfs, dijkstra, astar)
│
├── css/
│   └── style.css            # Legacy styles
│
├── graphify-out/            # Knowledge graph phân tích code
│   ├── graph.json
│   ├── GRAPH_REPORT.md
│   └── ...
│
└── docs/                    # Tài liệu dự án (bạn đang ở đây)
```

---

## File tree chi tiết (src/)

| File | Vai trò | Export chính |
|---|---|---|
| `src/main.jsx` | Mount React app vào DOM | `ReactDOM.createRoot` |
| `src/App.jsx` | Root: render sidebar + 4 board | `App` (default) |
| `src/hooks/usePathfinding.js` | State + orchestration | `usePathfinding` |
| `src/algorithms/bfs.js` | BFS | `runBFS` |
| `src/algorithms/dfs.js` | DFS | `runDFS` |
| `src/algorithms/dijkstra.js` | Dijkstra | `runDijkstra` |
| `src/algorithms/astar.js` | A* | `runAStar` |
| `src/utils/boardUtils.js` | Grid, neighbors, DOM | `createInitialGrid`, `getNeighbors`, `updateNodeDOM`, `resetDOMGrids` |
| `src/utils/heuristics.js` | Heuristic | `manhattanDistance` |
| `src/components/Board/Board.jsx` | Grid container | `Board` |
| `src/components/Board/Node.jsx` | Cell (memoized) | `Node` |
| `src/components/ControlPanel/ControlPanel.jsx` | Sidebar | `ControlPanel` |
| `src/components/Dashboard/MiniDashboard.jsx` | Stats bar | `MiniDashboard` |

---

## Entry points

1. **React App**: `index.html` → `src/main.jsx` → `src/App.jsx`
2. **Standalone demo**: `maze-demo.html` (mở trực tiếp, không qua React)

---

## Package.json scripts

```bash
npm run dev      # Khởi động dev server Vite
npm run build    # Build production
npm run preview  # Preview production build
```
