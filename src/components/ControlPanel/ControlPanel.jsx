import React from 'react';
import { ROWS, COLS } from '../../utils/boardUtils';

export const ControlPanel = ({ 
  speed, updateSpeed, 
  isRunning, isPaused, togglePause, 
  startAlgorithms, clearPath, 
  setBaseGrid, startNode, endNode 
}) => {
  
  const loadScenario = (type) => {
    if (isRunning) return;
    clearPath();
    setBaseGrid(prev => {
      const newGrid = prev.map(row => row.map(node => ({ ...node, isWall: false, weight: 1 })));

      if (type === 'maze') {
        // Thuật toán đệ quy quay lui (Recursive Backtracker) tạo mê cung chuẩn
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            newGrid[r][c].isWall = true;
          }
        }
        
        const stack = [];
        let startR = 1, startC = 1;
        newGrid[startR][startC].isWall = false;
        stack.push({ r: startR, c: startC });
        
        const dirs = [[-2, 0], [2, 0], [0, -2], [0, 2]];
        
        while (stack.length > 0) {
          const current = stack[stack.length - 1];
          const { r, c } = current;
          
          dirs.sort(() => Math.random() - 0.5); // Shuffle
          
          let moved = false;
          for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1 && newGrid[nr][nc].isWall) {
              newGrid[nr][nc].isWall = false;
              newGrid[r + dr / 2][c + dc / 2].isWall = false; // Xóa tường ở giữa
              stack.push({ r: nr, c: nc });
              moved = true;
              break;
            }
          }
          if (!moved) stack.pop();
        }
        
        // Đảm bảo điểm đầu và cuối không bị chặn hoàn toàn
        newGrid[startNode.r][startNode.c].isWall = false;
        newGrid[endNode.r][endNode.c].isWall = false;
        if (startNode.r > 0) newGrid[startNode.r - 1][startNode.c].isWall = false;
        if (endNode.r < ROWS - 1) newGrid[endNode.r + 1][endNode.c].isWall = false;

      } else {
        // Xử lý các kịch bản khác
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const isStartEnd = (r === startNode.r && c === startNode.c) || (r === endNode.r && c === endNode.c);
            if (isStartEnd) continue;

            if (type === 'random') {
              newGrid[r][c].isWall = Math.random() < 0.3;
            } else if (type === 'social') {
              // Trống
            } else if (type === 'traffic') {
              if (Math.random() < 0.25) newGrid[r][c].weight = Math.floor(Math.random() * 3) * 10 + 10;
            } else if (type === 'warehouse') {
              if (r % 3 !== 0 && c > 1 && c < COLS - 2 && c % 3 !== 0) {
                  newGrid[r][c].isWall = true;
              }
            }
          }
        }
      }
      return newGrid;
    });
  };

  const clearBoard = () => {
    if (isRunning) return;
    clearPath();
    setBaseGrid(prev => {
      const newGrid = [...prev];
      for (let r = 0; r < ROWS; r++) {
        newGrid[r] = [...newGrid[r]];
        for (let c = 0; c < COLS; c++) {
          newGrid[r][c].isWall = false;
          newGrid[r][c].weight = 1;
        }
      }
      return newGrid;
    });
  };

  return (
    <aside className="sidebar">
      <h1 className="logo">Algo<span>Trace</span></h1>
      
      <div className="control-group">
        <label>Chạy song song 4 thuật toán</label>
      </div>

      <div className="control-group">
        <label>Tốc độ chạy: {speed}%</label>
        <input 
          type="range" 
          min="1" max="100" 
          value={speed} 
          onChange={(e) => updateSpeed(e.target.value)} 
          className="modern-slider" 
        />
      </div>

      <div className="button-group">
        <button onClick={startAlgorithms} disabled={isRunning} className="btn primary">Chạy</button>
        <button onClick={togglePause} disabled={!isRunning} className="btn warning">
          {isPaused ? 'Tiếp tục' : 'Tạm Dừng'}
        </button>
        <button onClick={clearPath} disabled={isRunning} className="btn secondary">Xóa Đường Đi</button>
        <button onClick={clearBoard} disabled={isRunning} className="btn danger">Xóa Bảng</button>
      </div>

      <div className="control-group generator-group">
        <label>Kịch bản bài toán:</label>
        <button onClick={() => loadScenario('maze')} disabled={isRunning} className="btn outline">Mê cung (Thật)</button>
        <button onClick={() => loadScenario('random')} disabled={isRunning} className="btn outline">Bản đồ Ngẫu nhiên</button>
        <button onClick={() => loadScenario('social')} disabled={isRunning} className="btn outline">Mạng xã hội (Trống)</button>
        <button onClick={() => loadScenario('traffic')} disabled={isRunning} className="btn outline">Định tuyến (Trọng số)</button>
        <button onClick={() => loadScenario('warehouse')} disabled={isRunning} className="btn outline">Kho hàng (Vật cản)</button>
      </div>

      <div className="legend">
        <h3>Chú giải</h3>
        <div className="legend-item"><div className="color-box unvisited"></div> Chưa duyệt</div>
        <div className="legend-item"><div className="color-box processing"></div> Đang chờ (Queue/Stack)</div>
        <div className="legend-item"><div className="color-box visited"></div> Đã duyệt xong</div>
        <div className="legend-item"><div className="color-box path"></div> Đường đi kết quả</div>
        <div className="legend-item"><div className="color-box wall"></div> Vật cản tĩnh</div>
        <div className="legend-item"><div className="color-box backtrack"></div> Rút lui (DFS)</div>
      </div>
      
      <div className="instructions">
        <p><strong>Hướng dẫn:</strong></p>
        <p>- Kéo thả điểm Bắt đầu (Xanh dương) và Kết thúc (Đỏ).</p>
        <p>- Click và rê chuột trên lưới để vẽ tường/vật cản.</p>
        <p>- Nhấn CHẠY để xem 4 thuật toán đua nhau tìm đường!</p>
      </div>
    </aside>
  );
};
