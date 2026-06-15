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
          
          dirs.sort(() => Math.random() - 0.5);
          
          let moved = false;
          for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1 && newGrid[nr][nc].isWall) {
              newGrid[nr][nc].isWall = false;
              newGrid[r + dr / 2][c + dc / 2].isWall = false;
              stack.push({ r: nr, c: nc });
              moved = true;
              break;
            }
          }
          if (!moved) stack.pop();
        }
        
        newGrid[startNode.r][startNode.c].isWall = false;
        newGrid[endNode.r][endNode.c].isWall = false;
        if (startNode.r > 0) newGrid[startNode.r - 1][startNode.c].isWall = false;
        if (endNode.r < ROWS - 1) newGrid[endNode.r + 1][endNode.c].isWall = false;

      } else {
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const isStartEnd = (r === startNode.r && c === startNode.c) || (r === endNode.r && c === endNode.c);
            if (isStartEnd) continue;

            if (type === 'random') {
              newGrid[r][c].isWall = Math.random() < 0.3;
            } else if (type === 'social') {
            } else if (type === 'traffic') {
              if (Math.random() < 0.25) newGrid[r][c].weight = Math.floor(Math.random() * 3) * 10 + 10;
            } else if (type === 'warehouse') {
              if (r % 3 !== 0 && c > 1 && c < COLS - 2 && c % 3 !== 0) {
                  newGrid[r][c].isWall = true;
              }
            } else if (type === 'efficiency') {
              newGrid[r][c].isWall = false;
              newGrid[r][c].weight = 1;
            } else if (type === 'cost_battle') {
              const midCol = Math.floor(COLS / 2);
              if (c === midCol && r > 2 && r < ROWS - 3) {
                newGrid[r][c].weight = 50; 
              }
            }
          }
        }
      }
      return newGrid;
    });
  };

  const clearBoard = () => {
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
        <label>Tốc độ: {speed}%</label>
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
          {isPaused ? 'Tiếp' : 'Tạm Dừng'}
        </button>
        <button onClick={clearPath} className="btn secondary">Xóa Đường</button>
        <button onClick={clearBoard} className="btn danger">Xóa Bảng</button>
      </div>

      <div className="control-group generator-group">
        <label>Kịch bản</label>
        <button onClick={() => loadScenario('maze')} disabled={isRunning} className="btn outline">Mê cung</button>
        <button onClick={() => loadScenario('random')} disabled={isRunning} className="btn outline">Ngẫu nhiên</button>
        <button onClick={() => loadScenario('social')} disabled={isRunning} className="btn outline">Mạng XH</button>
        <button onClick={() => loadScenario('traffic')} disabled={isRunning} className="btn outline">Trọng số</button>
        <button onClick={() => loadScenario('warehouse')} disabled={isRunning} className="btn outline">Kho hàng</button>
        <button onClick={() => loadScenario('efficiency')} disabled={isRunning} className="btn outline highlight">A* Tốc độ</button>
        <button onClick={() => loadScenario('cost_battle')} disabled={isRunning} className="btn outline highlight">Dijkstra CP</button>
      </div>

      <div className="legend">
        <div className="legend-row">
          <div className="legend-item"><div className="color-box unvisited"></div>Nền</div>
          <div className="legend-item"><div className="color-box processing"></div>Chờ</div>
          <div className="legend-item"><div className="color-box visited"></div>Duyệt</div>
          <div className="legend-item"><div className="color-box path"></div>Đường</div>
          <div className="legend-item"><div className="color-box wall"></div>Tường</div>
          <div className="legend-item"><div className="color-box backtrack"></div>Lùi</div>
        </div>
      </div>
    </aside>
  );
};
