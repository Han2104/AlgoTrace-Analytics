# Kịch bản — Scenario Generation

**File**: `src/components/ControlPanel/ControlPanel.jsx` (hàm `loadScenario`, line 34)

Tất cả 7 kịch bản đều được tạo trong một hàm duy nhất `loadScenario(type)`. Khi user chọn kịch bản:
1. Nếu đang chạy → không làm gì
2. `clearPath()` — dừng thuật toán + xóa đường
3. Clone grid mới, reset tất cả wall và weight về mặc định
4. Áp dụng topology tương ứng

---

## 1. Mê cung (Recursive Backtracker) — `maze`

```js
// Bước 1: Fill toàn bộ grid với wall
for (let r = 0; r < ROWS; r++)
  for (let c = 0; c < COLS; c++)
    newGrid[r][c].isWall = true;

// Bước 2: Đệ quy quay lui (iterative stack)
const stack = [];
let startR = 1, startC = 1;
newGrid[startR][startC].isWall = false;
stack.push({ r: startR, c: startC });

const dirs = [[-2, 0], [2, 0], [0, -2], [0, 2]];

while (stack.length > 0) {
  const current = stack[stack.length - 1];
  const { r, c } = current;

  dirs.sort(() => Math.random() - 0.5);  // Randomize directions

  let moved = false;
  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1 && newGrid[nr][nc].isWall) {
      newGrid[nr][nc].isWall = false;
      newGrid[r + dr / 2][c + dc / 2].isWall = false;  // Remove wall BETWEEN cells
      stack.push({ r: nr, c: nc });
      moved = true;
      break;
    }
  }
  if (!moved) stack.pop();  // Backtrack
}
```

### Giải thích:
- **Iterative DFS-based maze**: dùng stack thay vì đệ quy (tránh stack overflow)
- **Bước nhảy 2 ô** (`[-2,0], [2,0]...`): vì mỗi ô cách nhau 1 ô tường
- **Xóa tường ở giữa** (`r + dr/2, c + dc/2`): ô nằm giữa 2 ô passage
- **Random shuffle directions** (`sort(() => Math.random() - 0.5)`): tạo maze ngẫu nhiên
- **Đảm bảo start/end không bị block**: force clear 2 ô xung quanh

### Ví dụ output:
```
█ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █
█ S · █ · · · █ · · · █ · · · █ · · · █
█ █ · █ · █ █ · █ · █ █ █ █ · █ · █ · █
█ · · · · █ · █ · · · · · · · █ · █ · █
█ · █ █ █ █ · █ █ █ █ █ █ █ █ █ · █ · █
█ · · · · · · · · · · · · · · · · █ · █
█ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ E █
```

---

## 2. Bản đồ Ngẫu nhiên — `random`

```js
newGrid[r][c].isWall = Math.random() < 0.3;
```

- 30% cơ hội mỗi ô là wall
- Hoàn toàn ngẫu nhiên
- Start và End không bị ảnh hưởng (skip)

---

## 3. Mạng xã hội (Trống) — `social`

```js
// Empty — không làm gì
```

- Grid hoàn toàn trống
- Mục đích: quan sát **pattern lan tỏa** của từng thuật toán trong không gian mở
- BFS lan tỏa đều hình tròn, DFS đi sâu một hướng, A* tập trung về đích

---

## 4. Định tuyến (Trọng số) — `traffic`

```js
if (Math.random() < 0.25)
  newGrid[r][c].weight = Math.floor(Math.random() * 3) * 10 + 10;  // 10, 20, hoặc 30
```

- 25% số ô có trọng số ngẫu nhiên (10, 20, 30)
- Không tạo wall
- Mục đích: kiểm tra khả năng **tối ưu chi phí** của Dijkstra và A*

**Cách đọc weight trên Node:**
- `weight-10`: background xanh nhạt (`rgba(209, 250, 229, 0.3)`)
- `weight-20`: background vàng (`#fef08a`)
- `weight-30`: background đỏ (`#fca5a5`)
- Hiển thị số ở giữa ô

---

## 5. Kho hàng (Vật cản) — `warehouse`

```js
if (r % 3 !== 0 && c > 1 && c < COLS - 2 && c % 3 !== 0) {
  newGrid[r][c].isWall = true;
}
```

- Tạo pattern dạng **kệ hàng (shelving)**
- Mô phỏng kho bãi, nhà máy
- BFS/Dijkstra phải đi vòng qua các kệ — thấy rõ sự khác biệt về chiến lược tìm đường

Pattern:
```
. . . . . . . . . . .
█ █ █ █ █ █ █ █ █ █ █
█ . █ . █ . █ . █ . █
█ . █ . █ . █ . █ . █
. . . . . . . . . . .
█ █ █ █ █ █ █ █ █ █ █
█ . █ . █ . █ . █ . █
```

---

## 6. Ưu thế A* (Tốc độ) — `efficiency`

```js
// Clear hết wall và weight
newGrid[r][c].isWall = false;
newGrid[r][c].weight = 1;
```

- Grid hoàn toàn trống
- Start (7,3) và End (7,16) ở xa nhau
- **Mục đích**: so sánh số node đã duyệt
  - BFS lan tỏa hình tròn → ~200+ nodes
  - DFS đi sâu một hướng → có thể may rủi
  - Dijkstra lan tỏa đều → ~200+ nodes
  - **A\*** tập trung về phía đích nhờ heuristic → ~80-100 nodes

Nút được highlight xanh (`class="btn highlight"`) vì đây là kịch bản demo mạnh cho A*.

---

## 7. Ưu thế Dijkstra (Chi phí) — `cost_battle`

```js
const midCol = Math.floor(COLS / 2);
// Tường trọng số cao ở giữa
if (c === midCol && r > 2 && r < ROWS - 3) {
  newGrid[r][c].weight = 50;
}
```

- Dải weight cao (50) ở cột giữa
- Để lại khe hở ở trên và dưới với weight=1
- **Mục đích**: so sánh chi phí đường đi
  - **BFS** chọn đường ngắn nhất (số bước) → xuyên qua dải weight 50 → **cost cao**
  - **Dijkstra** chọn đường rẻ nhất → đi vòng lên/xuống qua khe weight 1 → **cost thấp hơn**
  - **A\*** cũng tối ưu cost như Dijkstra

Nút được highlight xanh.
