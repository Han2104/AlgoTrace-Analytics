# PROJECT EXPLANATION

Tài liệu này giải thích cấu trúc, luồng dữ liệu và các chi tiết thuật toán cốt lõi (BFS, DFS, Dijkstra, A*) của dự án Pathfinding Visualizer.

## 1. Cấu trúc dự án (các file/thư mục quan trọng)
- `src/algorithms/` : Thư mục chứa cài đặt thuật toán cho React app (A*, Dijkstra, BFS, DFS).
- `js/algorithms/` : Bản JavaScript thuần (dùng cho phiên bản non-React/vanilla demo). Có thể tương đồng logic với `src/algorithms`.
- `src/components/Board/` : `Board.jsx`, `Node.jsx` — quản lý state lưới, node, và render.
- `src/hooks/usePathfinding.js` : Hook điều phối vòng đời chạy thuật toán, animation, và cập nhật UI.
- `src/utils/boardUtils.js` : Các tiện ích thao tác ma trận, neighbor extraction, và reset/clone grid.
- `src/utils/heuristics.js` : Hàm heuristic cho A* (Manhattan, Euclidean, v.v.).

## 2. Workflow — luồng dữ liệu
1. Người dùng tương tác trên UI (chọn start/finish, chướng ngại, thay đổi trọng số, bấm Run).
2. `Board` / `ControlPanel` cập nhật state lưới (matrix of nodes) trong React state hoặc Context.
3. `usePathfinding`/controller nhận snapshot của grid và tham số thuật toán (heuristic, allowDiagonal, weighted).
4. Controller chuẩn bị input: chuyển grid thành cấu trúc nội bộ (ví dụ: adjacency via neighbor function), thiết lập `start`, `target`.
5. Thuật toán được gọi (BFS/DFS/Dijkstra/A*). Thuật toán xuất ra hai thông tin chính:
   - `visitedOrder` (danh sách node được mở/khám phá theo thứ tự) dùng để animate mở rộng.
   - `shortestPath` (nếu tìm thấy) kết quả truy vết từ `target` về `start` để highlight.
6. Controller trả dữ liệu cho UI; animation/visualizer render `visitedOrder` rồi `shortestPath`.

## 3. Giải thích 4 thuật toán (cơ chế, Open/Closed)

1) Breadth-First Search (BFS)
- Mục đích: Tìm đường ngắn nhất theo số bước (số cạnh) trên đồ thị vô trọng số.
- Cấu trúc mở/đóng: Dùng `Queue` làm Open set (FIFO). Khi node được lấy ra khỏi queue, đánh dấu Closed (visited) ngay lập tức để tránh lặp.
- Tính chất: BFS khám phá theo ‘vòng tròn’ độ dần tăng của khoảng cách (số bước). Vì vậy, khi chạm target lần đầu là đường ngắn nhất về số bước.
- Hạn chế: Không xử lý trọng số; với cạnh có chi phí khác nhau, BFS không đảm bảo chi phí nhỏ nhất.

2) Depth-First Search (DFS)
- Mục đích: Khám phá sâu nhanh, phù hợp để kiểm tra khả năng truy cập hoặc backtracking.
- Cấu trúc mở/đóng: Dùng `Stack` (có thể đệ quy), đánh dấu visited khi push/pop tùy cài đặt (thường đánh dấu khi push để tránh push lại).
- Tính chất: Không đảm bảo tìm đường ngắn nhất; có nguy cơ đi sâu vô tận nếu không kiểm soát (vòng lặp) — cần visited set.

3) Dijkstra
- Mục đích: Tìm đường chi phí nhỏ nhất trên đồ thị có trọng số không âm.
- Cấu trúc mở/đóng: Dùng `Priority Queue` (min-heap) làm Open set, key = khoảng cách hiện tại `g(n)`. Closed set lưu các node đã được lấy ra với giá trị khoảng cách chính thức.
- Cơ chế: Lấy node có `g` nhỏ nhất từ PQ, cập nhật khoảng cách các neighbor nếu `g(current)+cost < g(neighbor)`.
- Tính chất: Đảm bảo tối ưu trong đồ thị trọng số không âm; khi có heuristic không trơn (như h(n)>0), dùng A* thay cho Dijkstra để tận dụng hướng tìm kiếm.

4) A* (A-Star)
- Mục đích: Tìm đường chi phí nhỏ nhất nhanh hơn Dijkstra bằng cách dùng heuristic hướng đến target.
- Cấu trúc mở/đóng: Dùng `Priority Queue` (min-heap) theo `f(n)=g(n)+h(n)`. Closed set ghi node đã được xử lý (tức là giá trị `g` đã tối ưu).
- Heuristic: Hàm `h(n)` ước lượng chi phí từ node hiện tại tới target (ví dụ Manhattan cho lưới 4-láng giềng). Heuristic cần là admissible (không bao giờ overestimate) để đảm bảo tính tối ưu.
- Khi `h(n)=0` cho mọi n thì A* suy giảm thành Dijkstra.

### So sánh qua ví dụ cụ thể
- Khi có chướng ngại vật làm đường đi thẳng không khả thi: Dijkstra khám phá mọi hướng theo chi phí, còn A* ưu tiên các node gần target (theo h) nên thường mở ít node hơn, nhanh hơn.
- Với đồ thị có trọng số: BFS/DFS không đảm bảo chi phí tối thiểu — phải dùng Dijkstra hoặc A*.
- Với ma trận lớn và target xa: A* với heuristic tốt sẽ giảm đáng kể Open set so với Dijkstra.

## 4. Ghi chú kỹ thuật quan trọng (các điểm cần lưu ý khi đọc code)
- Priority Queue / Min-Heap: Cần hỗ trợ `decrease-key` logic hoặc push nhiều lần với `g` nhỏ hơn và check tại pop. Thiết kế PQ đơn giản: push (node, priority); khi pop, nếu node có `g` không khớp priority hiện tại thì bỏ qua.
- Heuristic cho A*: Manhattan = |dx| + |dy| (for 4-neighbors) là admissible; Euclidean có thể dùng nếu di chuyển chéo cho phép.
- Backtracking (reconstruct path): Lưu `prev`/`parent` cho mỗi node khi relax/update; truy vết từ `target` về `start` theo parent để tạo đường đi (reverse cuối cùng).
- Tránh lặp vô hạn: Luôn duy trì `visited`/`closed` set; với DFS đệ quy, giới hạn độ sâu hoặc visited set là bắt buộc.
- Tránh tràn bộ nhớ: Sử dụng cấu trúc dữ liệu nhẹ (typed arrays nếu cần), xóa tham chiếu không cần thiết sau khi xong, và trong PQ tránh lưu bản sao toàn bộ grid trong mỗi entry.

## 5. Tài liệu dành cho buổi bảo vệ (gợi ý đề xuất trình bày)
- Mô tả luồng: UI -> State -> Controller -> Algorithm -> Vis (show visited nodes + final path).
- Minh hoạ bằng ví dụ: so sánh BFS vs Dijkstra vs A* trên cùng một grid có trọng số và chướng ngại.
- Những trade-offs: tốc độ (explored nodes), độ chính xác (optimality), bộ nhớ.

---
Tập trung đọc các file: [src/algorithms/astar.js](src/algorithms/astar.js), [src/algorithms/dijkstra.js](src/algorithms/dijkstra.js), [src/algorithms/bfs.js](src/algorithms/bfs.js), [src/algorithms/dfs.js](src/algorithms/dfs.js), và `usePathfinding.js` để hiểu cách controller kết nối UI và algorithms.
