import { useState, useRef, useCallback } from 'react';
import { createInitialGrid, ROWS, COLS, resetDOMGrids, updateNodeDOM } from '../utils/boardUtils';
import { runDFS } from '../algorithms/dfs';
import { runBFS } from '../algorithms/bfs';
import { runDijkstra } from '../algorithms/dijkstra';
import { runAStar } from '../algorithms/astar';

export const usePathfinding = () => {
  // ---------- STATE (dùng cho UI, re-render khi thay đổi) ----------
  const [baseGrid, setBaseGrid] = useState(createInitialGrid());   // Grid gốc dùng chung cho 4 thuật toán
  const [startNode, setStartNode] = useState({ r: 12, c: 6 });     // Ô bắt đầu (row, col)
  const [endNode, setEndNode] = useState({ r: 12, c: 33 });        // Ô kết thúc (row, col)
  const [isRunning, setIsRunning] = useState(false);                // Đang chạy thuật toán?
  const [isPaused, setIsPaused] = useState(false);                 // Đang tạm dừng?
  const [speed, setSpeed] = useState(50);                          // Tốc độ UI (0-100), dùng cho slider
  
  // Thống kê riêng cho từng thuật toán (visited, cost, status)
  const [stats, setStats] = useState({
    dfs: { visited: 0, cost: 0, status: 'Sẵn sàng' },
    bfs: { visited: 0, cost: 0, status: 'Sẵn sàng' },
    dijkstra: { visited: 0, cost: 0, status: 'Sẵn sàng' },
    astar: { visited: 0, cost: 0, status: 'Sẵn sàng' },
  });

  // ---------- REF (không gây re-render, dùng cho async logic) ----------
  const speedRef = useRef(100);          // Thời gian delay (ms) giữa các bước — đọc trong sleep()
  const pauseRef = useRef(false);        // Cờ tạm dừng — đọc trong sleep()
  const resolvePauseRef = useRef([]);    // Mảng chứa các hàm resolve của Promise tạm dừng
  const stopRef = useRef(false);         // Cờ dừng hẳn — đọc để thoát thuật toán

  // ---------- CẬP NHẬT TỐC ĐỘ ----------
  // Đồng bộ cả speed (state -> UI) và speedRef (ref -> logic async)
  const updateSpeed = (val) => {
    setSpeed(val);                         // Cập nhật state để slider re-render
    speedRef.current = Math.max(0, 100 - val);  // Map 0-100 -> ~100ms-0ms delay
  };

  // ---------- TẠM DỪNG / TIẾP TỤC ----------
  // Khi pause: gán pauseRef = true → sleep() sẽ chờ
  // Khi resume: resolve tất cả Promise đang chờ → sleep() thoát, thuật toán chạy tiếp
  const togglePause = () => {
    setIsPaused(prev => {
      const next = !prev;                  // Đảo trạng thái pause
      pauseRef.current = next;             // Đồng bộ ref
      if (!next && resolvePauseRef.current.length > 0) {
        // Nếu resume => giải phóng tất cả các Promise sleep() đang bị giữ
        resolvePauseRef.current.forEach(resolve => resolve());
        resolvePauseRef.current = [];      // Dọn mảng
      }
      return next;
    });
  };

  // ---------- HÀM SLEEP (delay giữa các bước) ----------
  // Được truyền vào từng thuật toán, dùng để tạo hiệu ứng animation
  const sleep = async () => {
    if (stopRef.current) throw new Error('CANCELLED');  // Nếu đã bị clear thì thoát ngay
    if (pauseRef.current) {
      // Nếu đang tạm dừng => chờ cho đến khi được resume
      await new Promise(res => resolvePauseRef.current.push(res));
      if (stopRef.current) throw new Error('CANCELLED'); // Kiểm tra lại sau khi resume
    }
    return new Promise(res => setTimeout(res, speedRef.current)); // Delay thực tế
  };

  // ---------- XÓA ĐƯỜNG ĐI / DỪNG THUẬT TOÁN ----------
  // Dừng tất cả, xóa grid về trạng thái ban đầu
  const clearPath = useCallback(() => {
    stopRef.current = true;                // Báo tất cả thuật toán dừng ngay
    if (resolvePauseRef.current.length > 0) {
      resolvePauseRef.current.forEach(resolve => resolve()); // Giải phóng nếu đang pause
      resolvePauseRef.current = [];
    }
    resetDOMGrids();                       // Xóa màu trên DOM grid
    setStats({                             // Reset stats
      dfs: { visited: 0, cost: 0, status: 'Sẵn sàng' },
      bfs: { visited: 0, cost: 0, status: 'Sẵn sàng' },
      dijkstra: { visited: 0, cost: 0, status: 'Sẵn sàng' },
      astar: { visited: 0, cost: 0, status: 'Sẵn sàng' },
    });
    pauseRef.current = false;
    setIsPaused(false);
    setIsRunning(false);
  }, []);

  // ---------- CHẠY TẤT CẢ THUẬT TOÁN ----------
  const startAlgorithms = async () => {
    if (isRunning) return;                 // Chặn bấm Start khi đang chạy
    stopRef.current = false;               // Reset cờ dừng
    resetDOMGrids();                       // Xóa DOM cũ

    // Reset stats
    setStats({
      dfs: { visited: 0, cost: 0, status: 'Sẵn sàng' },
      bfs: { visited: 0, cost: 0, status: 'Sẵn sàng' },
      dijkstra: { visited: 0, cost: 0, status: 'Sẵn sàng' },
      astar: { visited: 0, cost: 0, status: 'Sẵn sàng' },
    });
    setIsRunning(true);
    setIsPaused(false);
    pauseRef.current = false;

    // ----- Hàm phụ: tô đường đi ngay lập tức (không animate từng ô) -----
    const animatePath = async (algoId, path, cost) => {
      setStats(prev => ({ ...prev, [algoId]: { ...prev[algoId], cost, status: 'Hoàn thành' } }));
      for (let i = path.length - 2; i > 0; i--) {
        updateNodeDOM(algoId, path[i].r, path[i].c, ['path']);
      }
    };

    // ----- Hàm phụ: callback để mỗi thuật toán tự cập nhật stats -----
    // Trả về 1 hàm update (setter) riêng cho từng algoId
    const updateStat = (algoId) => (newStats) => {
      setStats(prev => ({ ...prev, [algoId]: { ...prev[algoId], ...newStats } }));
    };

    // ----- Hàm chạy 1 thuật toán (gọi runFunc tương ứng) -----
    const runAlgo = async (algoId, runFunc) => {
      try {
        // Gọi hàm thuật toán (runDFS, runBFS, runDijkstra, runAStar)
        const result = await runFunc(algoId, baseGrid, startNode, endNode, sleep, updateStat(algoId));
        if (stopRef.current) return;       // Nếu bị clear thì không animate
        if (result && result.path) {
          await animatePath(algoId, result.path, result.cost); // Tô đường đi
        } else {
          // Không tìm thấy đường
          setStats(prev => ({ ...prev, [algoId]: { ...prev[algoId], status: 'Không tìm thấy' } }));
        }
      } catch (e) {
        if (e.message !== 'CANCELLED') console.error(e); // Bỏ qua lỗi CANCELLED
      }
    };

    // ----- Chạy song song cả 4 thuật toán -----
    try {
      await Promise.all([
        runAlgo('dfs', runDFS),
        runAlgo('bfs', runBFS),
        runAlgo('dijkstra', runDijkstra),
        runAlgo('astar', runAStar),
      ]);
    } catch (e) {
      if (e.message !== 'CANCELLED') console.error(e);
    }

    // Kết thúc: tắt trạng thái running (trừ khi bị clear giữa chừng)
    if (!stopRef.current) {
      setIsRunning(false);
    }
  };

  // ---------- EXPORT cho component dùng ----------
  return {
    baseGrid, setBaseGrid,
    startNode, setStartNode,
    endNode, setEndNode,
    isRunning, isPaused, togglePause,
    speed, updateSpeed,
    stats, clearPath, startAlgorithms,
    ROWS, COLS
  };
};
