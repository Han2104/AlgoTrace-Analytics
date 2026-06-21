# AlgoTrace-Analytics 🔍

> **A real-time monitoring and visualization suite for graph traversal and routing algorithms.**

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![React](https://img.shields.io/badge/React-18.x-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📖 Overview

**AlgoTrace Analytics** is not just a standard pathfinding simulator; it is a deep-dive diagnostic tool designed to monitor algorithm execution states in real-time. By isolating the micro-metrics of various routing algorithms, this suite allows engineers and researchers to visualize search spaces, evaluate heuristic efficiency, and analyze memory states (Stacks/Queues) under different network topologies.

This project serves as a foundational module for understanding complex routing architectures, making it highly applicable to fields like network packet routing, logistics optimization, and AI pathfinding.

## ✨ Core Features

* **Real-time State Telemetry:** Visualizes the active state of data structures (Stack for DFS, Queue for BFS, Priority Queues for Dijkstra/A*).
* **Heuristic Analysis:** Demonstrates the impact of the $f(n) = g(n) + h(n)$ estimation function in A* compared to blind searches.
* **Performance Dashboards:** Tracks live metrics including Expanded Nodes (Search Space), Path Cost, and Execution Time.
* **Multi-Scenario Topologies:**
  * *Deep Maze:* Tests backtracking and depth-first exhaustion.
  * *Unweighted Social Graph:* Demonstrates degrees of separation and viral spread.
  * *Weighted Traffic Map:* Validates cost-based routing over distance-based routing.
  * *Warehouse Obstacles:* Simulates real-world robotic navigation constraints.

## 🧮 Supported Algorithms

1. **Depth-First Search (DFS):** Unweighted, emphasizes backtracking and deep branch exploration.
2. **Breadth-First Search (BFS):** Unweighted, guarantees the shortest path via radial expansion.
3. **Dijkstra's Algorithm:** Weighted, calculates the lowest-cost path from a single source to all other nodes.
4. **A* Search (A-Star):** Weighted + Heuristic, optimizes Dijkstra by directing the search toward the target.

## 🚀 Getting Started

### Prerequisites
* Node.js (v16.0 or higher)
* npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/Han2104/AlgoTrace-Analytics.git](https://github.com/Han2104/AlgoTrace-Analytics.git)
2. Navigate to the project directory:
    cd AlgoTrace-Analytics
3. Install dependencies:
    npm install
4. Start the development server:
    npm start
🛠️ Architecture & Tech Stack
Frontend: React.js (Functional Components, Hooks)

Styling: CSS3 / TailwindCSS

State Management: React Context API / Custom Hooks for animation loop control.

🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

📄 License
This project is MIT licensed.



## 📊 Thu thập dữ liệu Benchmark

Bạn có thể chạy benchmark hoàn toàn qua Terminal để thu thập số liệu cho 4 thuật toán (Dijkstra, DFS, BFS, A*).

- Chạy benchmark:

```bash
node scripts/run_benchmark.js
```

- File kết quả: `benchmark_results.csv` (tạo ở thư mục gốc) với các cột:
    - `algorithm`: Tên thuật toán (Dijkstra, DFS, BFS, A*)
    - `map`: Loại bản đồ được thử nghiệm (Empty, Random20, Maze, Weighted, Warehouse)
    - `trial`: Số lần chạy (1..500)
    - `executionTimeMs`: Thời gian thực thi (ms)
    - `nodesExpanded`: Số nút đã được mở/rà soát
    - `pathLength`: Độ dài đường tìm được (nếu tìm thấy)
    - `pathFound`: `true`/`false` cho biết có tìm thấy đường hay không
    - `maxFringeSize`: Kích thước lớn nhất của fringe (queue/stack/priority array) trong quá trình chạy

- 5 kịch bản map được thử nghiệm:
    1. `Empty`: Lưới trống, không có vật cản.
    2. `Random20`: Vật cản ngẫu nhiên ~20% ô.
    3. `Maze`: Mê cung được sinh bằng mô phỏng backtracker (maze-like passages).
    4. `Weighted`: Lưới không có tường nhưng có ô trọng số nặng ngẫu nhiên.
    5. `Warehouse`: Các khối "kệ" (blocks) cố định tạo thành lối đi/đường ray như trong kho hàng.

Ghi chú: Script chạy thuật toán ở chế độ benchmark (không cập nhật DOM hoặc React state) và chỉ trả về các metrics thuần túy để đảm bảo tính reproducible khi chạy trên Node.js.