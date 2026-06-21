// TRẠNG THÁI TƯƠNG TÁC (Interaction State)
let isMouseDown = false;
let draggedNode = null; // Biến cờ (flag): Lưu trữ trạng thái kéo thả ('start', 'end' hoặc null)
let gridContainer; // Tham chiếu vùng chứa lưới

function initGrid() {
    gridContainer = document.getElementById('grid-container');
    createGrid();
}

// KHỞI TẠO LƯỚI
function createGrid() {
    gridContainer.innerHTML = ''; // Xóa sạch DOM cũ (nếu có)
    const gridElement = document.createElement('div'); // Tạo thẻ <div> mới
    gridElement.className = 'grid';
    // Ép kiểu CSS Grid Layout bằng inline-style. 
    // Nội suy chuỗi (Template literals `${}`) tương tự sprintf trong C.
    gridElement.style.gridTemplateColumns = `repeat(${COLS}, 25px)`;
    gridElement.style.gridTemplateRows = `repeat(${ROWS}, 25px)`;

    grid = []; // Xóa cấu trúc dữ liệu cũ
    
    for (let r = 0; r < ROWS; r++) {
        const row = [];
        for (let c = 0; c < COLS; c++) {
            // Khởi tạo Dữ liệu (Logic State)
            const nodeInfo = { r, c, isWall: false, weight: 1, isVisited: false };
            row.push(nodeInfo);

            // Khởi tạo Giao diện (UI State)
            const nodeEl = document.createElement('div');
            nodeEl.id = `node-${r}-${c}`;
            nodeEl.className = 'node';
            
            // Gán class đặc biệt cho node bắt đầu và kết thúc
            if (r === startNode.r && c === startNode.c) nodeEl.classList.add('start');
            else if (r === endNode.r && c === endNode.c) nodeEl.classList.add('end');

            // [LỖI KIẾN TRÚC]: Gắn trực tiếp Listener vào từng node (Tạo 2400 listeners).
            // Nên dùng Event Delegation ở gridContainer.
            nodeEl.addEventListener('mousedown', (e) => handleMouseDown(r, c, e));
            nodeEl.addEventListener('mouseenter', (e) => handleMouseEnter(r, c, e));
            nodeEl.addEventListener('mouseup', handleMouseUp);

            gridElement.appendChild(nodeEl);
        }
        grid.push(row);
    }
    gridContainer.appendChild(gridElement);
    
    // Ngăn lỗi kẹt trạng thái: Nếu chuột kéo ra ngoài container rồi mới thả (mouseup).
    gridContainer.addEventListener('mouseleave', handleMouseUp);
}

// XỬ LÝ NHẤN CHUỘT KHOÁ (Mouse Down)
function handleMouseDown(r, c, e) {
    e.preventDefault(); // Ngăn hành vi mặc định của trình duyệt (như bôi đen text)
    if (isRunning) return; // Khóa tương tác khi thuật toán đang chạy (Mutex lock concept)
    
    isMouseDown = true; // Bật cờ (flag) đang giữ chuột
    
    // Xác định đối tượng đang được nhấn
    if (r === startNode.r && c === startNode.c) {
        draggedNode = 'start';
    } else if (r === endNode.r && c === endNode.c) {
        draggedNode = 'end';
    } else {
        toggleWall(r, c); // Nếu nhấn vào ô trống, đổi nó thành tường
    }
}

// XỬ LÝ LƯỚT CHUỘT KHOÁ (Mouse Enter - Cơ chế Drag & Drop)
function handleMouseEnter(r, c, e) {
    e.preventDefault();
    if (!isMouseDown || isRunning) return; // Chỉ kích hoạt nếu đang giữ chuột và không chạy thuật toán

    // XỬ LÝ KÉO THẢ NODE ĐẶC BIỆT
    if (draggedNode === 'start') {
        if (r === endNode.r && c === endNode.c) return; // Chống ghi đè đích
        
        // Cập nhật DOM cũ
        getNodeEl(startNode.r, startNode.c).classList.remove('start');
        
        // Cập nhật State Logic
        startNode = { r, c };
        grid[r][c].isWall = false; // Xóa tường nếu kéo vào vị trí có tường
        
        // Cập nhật DOM mới
        getNodeEl(r, c).className = 'node start';
        
    } else if (draggedNode === 'end') {
        if (r === startNode.r && c === startNode.c) return; // Chống ghi đè bắt đầu
        getNodeEl(endNode.r, endNode.c).classList.remove('end');
        endNode = { r, c };
        grid[r][c].isWall = false;
        getNodeEl(r, c).className = 'node end';
        
    } else {
        // XỬ LÝ VẼ TƯỜNG (Quét chuột)
        if ((r === startNode.r && c === startNode.c) || (r === endNode.r && c === endNode.c)) return;
        toggleWall(r, c);
    }
}

// XỬ LÝ NHẢ CHUỘT
function handleMouseUp() {
    isMouseDown = false;
    draggedNode = null; // Xóa trạng thái máy trạng thái (Reset State Machine)
}

// BẬT/TẮT TƯỜNG CẢN
function toggleWall(r, c) {
    const node = grid[r][c]; // Truy xuất theo tham chiếu (Reference)
    
    // Ràng buộc logic: Trọng số (weight) và Tường (wall) là Mutually Exclusive (loại trừ lẫn nhau)
    if (node.weight > 1) {
        node.weight = 1;
        getNodeEl(r, c).innerHTML = ''; // Xóa chữ số hiển thị trọng số
        getNodeEl(r, c).className = 'node';
    }
    
    node.isWall = !node.isWall; // Toán tử bitwise đảo trạng thái boolean
    
    // Cập nhật DOM tương ứng
    if (node.isWall) {
        getNodeEl(r, c).className = 'node wall';
    } else {
        getNodeEl(r, c).className = 'node';
    }
}

// DỌN DẸP TRẠNG THÁI ĐƯỜNG ĐI (Reset State)
function clearPath() {
    // Duyệt toàn bộ ma trận O(N*M)
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            grid[r][c].isVisited = false;
            const el = getNodeEl(r, c);
            const isStart = r === startNode.r && c === startNode.c;
            const isEnd = r === endNode.r && c === endNode.c;
            
            // Xóa các class CSS liên quan tới thuật toán ('visited', 'path', 'processing')
            // Bằng cách gán đè className.
            if (!isStart && !isEnd && !grid[r][c].isWall) {
                if (grid[r][c].weight > 1) {
                    el.className = `node weight-${grid[r][c].weight}`;
                } else {
                    el.className = 'node';
                }
                // Dùng toán tử 3 ngôi (Ternary Operator) để giữ lại text trọng số
                el.innerHTML = grid[r][c].weight > 1 ? `<span class="cost-text">${grid[r][c].weight}</span>` : '';
            } else if (isStart || isEnd) {
                el.innerHTML = ''; // Đảm bảo node gốc không chứa text thừa
            }
        }
    }
    // Đặt lại các biến thống kê giao diện
    statVisited.innerText = '0';
    statCost.innerText = '0';
    statStatus.innerText = 'Sẵn sàng';
}

// TẠO TRỌNG SỐ NGẪU NHIÊN (Sử dụng hàm phân phối đều Pseudo-random)
function generateWeights() {
    clearPath();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if ((r === startNode.r && c === startNode.c) || (r === endNode.r && c === endNode.c) || grid[r][c].isWall) continue;
            
            // Math.random() trả về float từ 0 đến cận dưới 1. Xác suất 30% tạo trọng số.
            if (Math.random() < 0.3) {
                // Tạo số nguyên ngẫu nhiên là bội của 10, từ 10 đến 30.
                const w = Math.floor(Math.random() * 3) * 10 + 10; 
                grid[r][c].weight = w;
                
                const el = getNodeEl(r, c);
                el.className = `node weight-${w}`;
                el.innerHTML = `<span class="cost-text">${w}</span>`;
            } else {
                // Reset về node mặc định
                grid[r][c].weight = 1;
                getNodeEl(r, c).className = 'node';
                getNodeEl(r, c).innerHTML = '';
            }
        }
    }
}

// TẠO MÊ CUNG NGẪU NHIÊN (Noise Generation)
function generateMaze() {
    clearPath();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if ((r === startNode.r && c === startNode.c) || (r === endNode.r && c === endNode.c)) continue;
            
            // Ép logic: Sinh maze thì phải xóa trọng số (Tránh conflict logic khi test thuật toán)
            grid[r][c].weight = 1;
            getNodeEl(r, c).innerHTML = '';
            
            // 30% xác suất xuất hiện Tường
            if (Math.random() < 0.3) {
                grid[r][c].isWall = true;
                getNodeEl(r, c).className = 'node wall';
            } else {
                grid[r][c].isWall = false;
                getNodeEl(r, c).className = 'node';
            }
        }
    }
}