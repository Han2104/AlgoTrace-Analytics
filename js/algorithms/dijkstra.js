// Hàm bất đồng bộ (async): Cần thiết trong JS để sử dụng 'await', 
// giúp giải phóng Call Stack, không làm treo trình duyệt khi xử lý vòng lặp lớn.
async function runDijkstra() {
    // TẠO HÀNG ĐỢI (Queue)
    // [Cảnh báo Kiến trúc]: Đang dùng mảng thuần thay vì Min-Heap.
    // Việc lưu trữ 'path' dạng mảng trong queue sẽ làm phình bộ nhớ nhanh chóng.
    let pq = [{ r: startNode.r, c: startNode.c, cost: 0, path: [] }];
    
    // TẠO MA TRẬN KHOẢNG CÁCH (Distance Matrix)
    // Tạo mảng 2 chiều ROWS x COLS, gán mọi đỉnh là Infinity (vô cực).
    let dist = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
    dist[startNode.r][startNode.c] = 0; // Đỉnh bắt đầu có khoảng cách là 0
    let visitedNodes = 0;

    // Vòng lặp chính của Dijkstra
    while (pq.length > 0) {
        // [CẢNH BÁO HIỆU NĂNG NGHIÊM TRỌNG]
        // Sắp xếp toàn bộ mảng có độ phức tạp O(N log N) ở mỗi bước.
        // Nút thắt cổ chai làm chậm thuật toán so với O(log N) của Min-Heap.
        pq.sort((a, b) => a.cost - b.cost); 
        
        // Lấy và xóa phần tử đầu tiên của mảng (phần tử có cost nhỏ nhất).
        // Lệnh shift() cũng tốn O(N) thời gian do phải dời lại chỉ số các phần tử còn lại.
        const current = pq.shift();
        
        // Destructuring: Tách các thuộc tính của object 'current' thành các biến.
        const { r, c, cost, path } = current;

        // Nếu node này đã duyệt qua thì bỏ qua (Tránh chu trình)
        // [Chú ý]: Thuộc tính isVisited thao tác trực tiếp lên biến toàn cục 'grid'
        if (grid[r][c].isVisited) continue;
        grid[r][c].isVisited = true;
        
        // Thống kê số node đã duyệt.
        visitedNodes++;
        // [Vi phạm SoC]: Thao tác trực tiếp với DOM (UI) bên trong thuật toán.
        statVisited.innerText = visitedNodes;

        // Xử lý Giao diện người dùng (UI)
        if (r !== startNode.r || c !== startNode.c) {
            const el = getNodeEl(r, c); // Lấy phần tử HTML tương ứng với tọa độ
            el.classList.remove('processing'); // Thay đổi CSS class
            el.classList.add('visited');
            if (r !== endNode.r || c !== endNode.c) {
                // Tiêm HTML trực tiếp (DOM Manipulation tốn kém).
                el.innerHTML = `<span class="cost-text" style="font-size: 8px;">${cost}</span>`;
            }
        }

        // ĐIỀU KIỆN DỪNG: Đã tìm thấy đích
        if (r === endNode.r && c === endNode.c) {
            // Trả về mảng đường đi và tổng chi phí.
            // Cú pháp [...path, {r, c}] tạo ra bản sao mảng hiện tại và nối thêm đích vào.
            return { path: [...path, {r, c}], cost: cost };
        }

        // Lấy danh sách các node kề (Trên, Dưới, Trái, Phải)
        const neighbors = getNeighbors(r, c);
        
        // Duyệt qua các node kề (Relaxation)
        for (const n of neighbors) {
            // Tính chi phí đi từ node hiện tại sang node kề 'n'
            const altCost = cost + grid[n.r][n.c].weight;
            
            // Nếu tìm được đường ngắn hơn, cập nhật và đẩy vào hàng đợi
            if (altCost < dist[n.r][n.c]) {
                dist[n.r][n.c] = altCost;
                
                // [CẢNH BÁO BỘ NHỚ]: Sao chép mảng path liên tục tại đây: [...path, {r,c}]
                // Sẽ tạo ra hàng nghìn mảng rác trên lưới lớn.
                pq.push({ r: n.r, c: n.c, cost: altCost, path: [...path, {r, c}] });
                
                // Cập nhật giao diện: Node đang được xử lý chờ
                if (n.r !== endNode.r || n.c !== endNode.c) {
                    getNodeEl(n.r, n.c).classList.add('processing');
                }
            }
        }
        
        // Tạm dừng thực thi hàm để trình duyệt (Browser) có thời gian vẽ (Render) lại DOM.
        // Đây là lý do hàm này buộc phải khai báo là async.
        await sleep();
    }
    
    // Nếu queue rỗng mà chưa gặp đích -> Không có đường đi.
    return null;
}