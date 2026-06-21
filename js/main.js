// BINDING GIAO DIỆN (DOM References)
// 'document.getElementById' duyệt qua cây DOM (Document Object Model) do trình duyệt tạo ra.
// Trả về tham chiếu (con trỏ) tới vùng nhớ của thẻ HTML tương ứng.
const algoSelect = document.getElementById('algorithm');
const speedSlider = document.getElementById('speed');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnClearPath = document.getElementById('btn-clear-path');
const btnClearBoard = document.getElementById('btn-clear-board');
const btnGenMaze = document.getElementById('btn-gen-maze');
const btnGenWeights = document.getElementById('btn-gen-weights');

// Khởi tạo các biến toàn cục (đã khai báo ở file trước)
statStatus = document.getElementById('stat-status');
statVisited = document.getElementById('stat-visited');
statCost = document.getElementById('stat-cost');

// EVENT REGISTRATION (Đăng ký bộ lắng nghe sự kiện)
// Tương tự Observer Pattern trong Java: Đăng ký một hàm Callback để hệ điều hành/trình duyệt 
// kích hoạt khi sự kiện xảy ra (Interrupt handling).
function setupEventListeners() {
    // Sự kiện 'input' kích hoạt liên tục khi kéo thanh trượt (slider)
    speedSlider.addEventListener('input', (e) => {
        // [Điểm yếu Kỹ thuật]: Sử dụng Magic Numbers (200, 1.9)
        // Hệ số này ngụ ý: value càng lớn -> speed (thời gian trễ) càng nhỏ -> chạy càng nhanh.
        speed = 200 - (e.target.value * 1.9); 
    });
    // Khởi tạo tốc độ mặc định ban đầu dựa trên công thức
    speed = 200 - (50 * 1.9);

    // Truyền trực tiếp con trỏ hàm 'startAlgorithm' (không có ngoặc đơn)
    btnStart.addEventListener('click', startAlgorithm);
    
    // CƠ CHẾ TẠM DỪNG BẤT ĐỒNG BỘ
    btnPause.addEventListener('click', () => {
        isPaused = !isPaused; // Đảo trạng thái cờ
        if (isPaused) {
            btnPause.innerText = 'Tiếp tục';
            statStatus.innerText = 'Tạm dừng';
        } else {
            btnPause.innerText = 'Dừng';
            statStatus.innerText = 'Đang chạy...';
            // [Cơ chế cốt lõi]: Nếu biến 'pauseResolve' đang giữ tham chiếu tới hàm resolve() 
            // của một Promise (được tạo ra trong hàm sleep() ở file trước), ta gọi nó để 
            // "Mở khóa" (unblock) lệnh 'await', cho phép thuật toán chạy tiếp.
            if (pauseResolve) pauseResolve(); 
        }
    });

    // Các hàm kiểm tra cờ 'isRunning'. Nếu true (đang chạy), lập tức return để 
    // chặn mọi thao tác làm thay đổi ma trận (State Mutability), tránh phá vỡ thuật toán.
    btnClearPath.addEventListener('click', () => {
        if (isRunning) return;
        clearPath();
    });

    btnClearBoard.addEventListener('click', () => {
        if (isRunning) return;
        createGrid();
        statVisited.innerText = '0';
        statCost.innerText = '0';
        statStatus.innerText = 'Sẵn sàng';
    });

    btnGenMaze.addEventListener('click', () => {
        if (isRunning) return;
        generateMaze();
    });

    btnGenWeights.addEventListener('click', () => {
        if (isRunning) return;
        generateWeights();
    });
}

// BỘ ĐIỀU PHỐI THUẬT TOÁN (Algorithm Dispatcher)
// Đánh dấu 'async' vì nó sẽ gọi các hàm thuật toán chứa 'await'
async function startAlgorithm() {
    // 1. CHUẨN BỊ TRẠNG THÁI (State Initialization & Locking)
    if (isRunning) return; // Bảo vệ hàm khỏi việc bị gọi nhiều lần đồng thời
    clearPath(); // Dọn dẹp trạng thái lưới cũ
    
    isRunning = true;      // Đóng khóa (Lock)
    btnStart.disabled = true; // Vô hiệu hóa nút UI, ngăn chặn thao tác dư thừa
    btnPause.disabled = false;
    statStatus.innerText = 'Đang chạy...';

    // 2. PHÂN LUỒNG XỬ LÝ (Routing)
    const algo = algoSelect.value;
    let pathFound = null;

    // 3. THỰC THI AN TOÀN (Safe Execution Block)
    // Tương tự try-catch-finally trong Java. Rất quan trọng trong JS bất đồng bộ.
    try {
        // Đợi (await) thuật toán trả về kết quả. 
        // JS engine có thể đi làm việc khác (vẽ UI) trong lúc chờ.
        if (algo === 'dfs') pathFound = await runDFS();
        else if (algo === 'bfs') pathFound = await runBFS();
        else if (algo === 'dijkstra') pathFound = await runDijkstra();
        else if (algo === 'astar') pathFound = await runAStar();

        // 4. XỬ LÝ KẾT QUẢ (Result Handling)
        if (pathFound && pathFound.path) {
            await animatePath(pathFound.path, pathFound.cost);
        } else {
            statStatus.innerText = 'Không tìm thấy đường';
        }
    } catch (e) {
        // Bắt lỗi nếu các thuật toán throw Error (ví dụ: truy cập mảng ngoài giới hạn)
        console.error(e);
    } finally {
        // 5. DỌN DẸP (Cleanup & Unlocking)
        // Khối finally luôn được gọi bất kể thuật toán thành công hay ném ra lỗi.
        // Điều này đảm bảo ứng dụng không bao giờ bị kẹt ở trạng thái "isRunning = true" mãi mãi.
        isRunning = false; // Mở khóa (Unlock)
        btnStart.disabled = false;
        btnPause.disabled = true;
        
        // Đặt lại cờ Pause nếu người dùng nhấn Stop/End trong khi đang Pause
        if (isPaused) {
            isPaused = false;
            btnPause.innerText = 'Dừng';
        }
    }
}

// KHỞI ĐỘNG ỨNG DỤNG (Bootstrapping)
// Trình duyệt sẽ thực thi 2 lệnh này từ trên xuống dưới ngay khi nạp file JS.
initGrid();
setupEventListeners();