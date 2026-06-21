// CONSTANTS (Hằng số)
// [Vai trò]: Định nghĩa kích thước cố định của ma trận (Grid).
// [JavaScript cơ bản]: 'const' ngăn chặn việc gán lại giá trị cho biến. Giống 'final' trong Java.
const ROWS = 20;
const COLS = 40;

// GLOBAL STATE (Trạng thái toàn cục)
// [Vai trò]: Lưu trữ dữ liệu cốt lõi của ứng dụng.
// [Rủi ro Kiến trúc]: Giống như việc dùng 'public static' cho mọi biến trong Java. 
// Bất kỳ hàm nào cũng có thể sửa đổi 'grid' hay 'startNode', khiến việc kiểm thử (Unit Test)
// hoặc mở rộng ứng dụng (ví dụ: chạy 2 grid cùng lúc trên màn hình) trở nên bất khả thi.
let grid = []; 
let startNode = { r: 10, c: 5 }; // Object lưu tọa độ, giống struct trong C.
let endNode = { r: 10, c: 34 };

// CONTROL FLAGS (Cờ điều khiển luồng)
// Dùng để quản lý vòng đời của thuật toán (đang chạy, bị tạm dừng).
let isRunning = false;
let isPaused = false;
let pauseResolve = null; // Con trỏ hàm (Function pointer) dùng để "mở khóa" khi tạm dừng.
let speed = 50; // Tốc độ trễ (delay) tính bằng milliseconds.

// DOM ELEMENTS (Biến tham chiếu Giao diện)
// [Vai trò]: Lưu trữ tham chiếu tới các thẻ HTML (DOM). 
// Việc khai báo trước ở đây nhưng khởi tạo sau (ở main.js) là một dạng "Forward Declaration".
let statStatus;
let statVisited;
let statCost;

// DOM QUERY FUNCTION (Hàm truy vấn Giao diện)
// [Vai trò]: Lấy ra một phần tử HTML trên lưới dựa vào tọa độ row (r) và col (c).
function getNodeEl(r, c) {
    // [Cảnh báo Hiệu năng]: Gọi document.getElementById liên tục trong vòng lặp thuật toán
    // là một thao tác cực kỳ đắt đỏ (expensive) vì nó phải giao tiếp với Render Engine của trình duyệt.
    // Cách tối ưu hơn: Lưu sẵn các tham chiếu (references) này vào một mảng 2 chiều khi khởi tạo.
    return document.getElementById(`node-${r}-${c}`);
}

// ASYNC DELAY & PAUSE MECHANISM (Cơ chế Trễ và Tạm dừng Bất đồng bộ)
// [Vai trò]: Thay thế cho Thread.sleep() trong Java. Vì JS chỉ có 1 luồng chính (Single Thread),
// ta không thể block luồng này, nếu không giao diện sẽ bị "đơ" hoàn toàn.
async function sleep() {
    if (isPaused) {
        // [Cơ chế hoạt động]: Nếu đang Pause, tạo ra một Promise (tương tự Future trong Java)
        // nhưng KHÔNG gọi 'resolve' ngay. Ta gán hàm 'resolve' vào biến toàn cục 'pauseResolve'.
        // Thuật toán sẽ kẹt tại dòng 'await' này cho đến khi có một hàm khác (như nút Play) 
        // gọi pauseResolve() từ bên ngoài. Đây là một pattern khóa (lock) phổ biến trong JS.
        await new Promise(resolve => pauseResolve = resolve);
    }
    // Tạo khoảng trễ bằng setTimeout (hàm phi đồng bộ của trình duyệt).
    return new Promise(resolve => setTimeout(resolve, speed));
}

// GRAPH NEIGHBOR DISCOVERY (Hàm tìm đỉnh kề)
// [Vai trò]: Tìm các đỉnh hợp lệ liền kề (Trên, Phải, Dưới, Trái) của một tọa độ cho trước.
function getNeighbors(r, c) {
    const neighbors = [];
    
    // Kiểm tra biên (Boundary Checks) để tránh lỗi Index Out Of Bounds
    if (r > 0) neighbors.push({ r: r - 1, c: c });
    if (c < COLS - 1) neighbors.push({ r: r, c: c + 1 });
    if (r < ROWS - 1) neighbors.push({ r: r + 1, c: c });
    if (c > 0) neighbors.push({ r: r, c: c - 1 });
    
    // [Cảnh báo Hiệu năng]: Việc dùng hàm .filter() ở cuối sẽ tạo thêm một mảng mới trong bộ nhớ.
    // Sẽ tối ưu hơn (tránh phân bổ bộ nhớ dư thừa) nếu ta kiểm tra isWall trực tiếp ngay trong 
    // các lệnh if ở trên: if (r > 0 && !grid[r - 1][c].isWall) ...
    return neighbors.filter(n => !grid[n.r][n.c].isWall);
}

// PATH ANIMATION (Hàm vẽ hiệu ứng đường đi)
// [Vai trò]: Nhận kết quả từ thuật toán và cập nhật giao diện (UI).
async function animatePath(path, cost) {
    // Cập nhật text trên bảng điều khiển
    statStatus.innerText = 'Hoàn thành';
    statCost.innerText = cost;
    
    // [Phân tích Logic]: Vòng lặp chạy ngược từ cuối mảng lên đầu (i = path.length - 2 xuống 1).
    // Điều này ngụ ý mảng 'path' chứa cả đích (endNode) ở cuối và gốc (startNode) ở đầu.
    // Việc bỏ qua phần tử cuối cùng (length - 1) và đầu tiên (0) có thể là do
    // không muốn ghi đè màu/icon của đỉnh Bắt đầu và Kết thúc trên giao diện.
    for (let i = path.length - 2; i > 0; i--) {
        const node = path[i];
        const el = getNodeEl(node.r, node.c);
        
        // Thêm CSS class 'path' để trình duyệt tự động kích hoạt hiệu ứng chuyển màu (CSS Transition/Animation)
        el.classList.add('path');
        
        // Đợi một chút rồi mới vẽ bước tiếp theo, tạo hiệu ứng lan truyền (Animation Frame)
        await sleep();
    }
}