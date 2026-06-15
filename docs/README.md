# Tài liệu dự án AlgoTrace-Analytics

## Giới thiệu

Đây là tài liệu chi tiết về dự án **AlgoTrace-Analytics** — công cụ trực quan hóa và so sánh 4 thuật toán tìm đường chạy song song, xây dựng bằng React + Vite.

## Mục lục tài liệu

| File | Mô tả |
|---|---|
| [overview.md](./overview.md) | Tổng quan dự án, công nghệ, cấu trúc thư mục |
| [architecture.md](./architecture.md) | Component hierarchy, data flow, state management |
| [algorithms.md](./algorithms.md) | Phân tích chi tiết 4 thuật toán: BFS, DFS, Dijkstra, A* |
| [components.md](./components.md) | Tất cả components: Board, Node, ControlPanel, MiniDashboard |
| [hooks.md](./hooks.md) | usePathfinding hook — orchestration, pause/resume, sleep |
| [scenarios.md](./scenarios.md) | 7 kịch bản topology: maze, random, traffic, warehouse... |
| [design-patterns.md](./design-patterns.md) | Performance patterns: direct DOM, refs, Promise pause, memo |

## Cách sử dụng

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production
npm run preview
```

## Mở rộng

Để thêm thuật toán mới:
1. Tạo file trong `src/algorithms/` — export async function với interface `(algoId, baseGrid, startNode, endNode, sleep, updateStats)`
2. Import trong `src/hooks/usePathfinding.js`
3. Thêm vào `Promise.all` trong `startAlgorithms()`
4. Thêm entry vào mảng `algorithms` trong `src/App.jsx`
5. Thêm stat entry trong `useState` stats
