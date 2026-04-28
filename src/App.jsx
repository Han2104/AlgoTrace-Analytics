import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Play, Square, Compass, Map } from 'lucide-react';
import { generateMap, getRandomPositions } from './utils/mazeGenerator';
import { MazeBoard } from './components/MazeBoard';
import './App.css';

const ROWS = 20;
const COLS = 20;

export default function App() {
  const [grid, setGrid] = useState([]);
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [seed, setSeed] = useState('');
  
  const [speed, setSpeed] = useState(50); // 1-100
  const [isTracing, setIsTracing] = useState(false);
  const [traceTrigger, setTraceTrigger] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [mapType, setMapType] = useState('maze'); // maze, warehouse, network, weighted

  const algorithms = [
    { id: 'astar', title: 'A* (Tìm đường tối ưu)' },
    { id: 'dijkstra', title: 'Dijkstra (Tìm theo trọng số)' },
    { id: 'bfs', title: 'BFS (Tìm kiếm chiều rộng)' },
    { id: 'dfs', title: 'DFS (Tìm kiếm chiều sâu)' }
  ];

  const handleGenerateMaze = useCallback(() => {
    setIsTracing(false);
    
    const newGrid = generateMap(mapType, ROWS, COLS);
    const { startNode: sNode, endNode: eNode } = getRandomPositions(newGrid);
    
    setGrid(newGrid);
    setStartNode(sNode);
    setEndNode(eNode);
    setSeed(Math.random().toString(36).substring(2, 8).toUpperCase());
  }, [mapType]);

  useEffect(() => {
    handleGenerateMaze();
  }, [handleGenerateMaze]);

  const toggleTracing = () => {
    if (!startNode || !endNode) return;
    if (isTracing) {
      setIsTracing(false);
    } else {
      setCompletedCount(0);
      setTraceTrigger(prev => prev + 1);
      setIsTracing(true);
    }
  };

  const handleBoardComplete = useCallback(() => {
    setCompletedCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (completedCount === algorithms.length && isTracing) {
      setIsTracing(false);
    }
  }, [completedCount, isTracing, algorithms.length]);

  return (
    <div className="app-layout">
      {/* Sidebar Controls */}
      <aside className="sidebar">
        <div className="brand">
          <h1><Compass size={28} color="#39ff14"/> <span>Algo</span>Trace</h1>
        </div>

        <div className="control-group" style={{ marginTop: '20px' }}>
          <label>Loại Bản Đồ</label>
          <select 
            className="styled-select" 
            value={mapType} 
            onChange={(e) => setMapType(e.target.value)}
            disabled={isTracing}
          >
            <option value="maze">Mê cung ngẫu nhiên</option>
            <option value="warehouse">Kho hàng (Vật chắn)</option>
            <option value="network">Không gian mạng</option>
            <option value="weighted">Bản đồ trọng số</option>
          </select>
        </div>

        <div className="control-group" style={{ marginTop: '10px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tốc độ quét</span>
            <span style={{ color: 'var(--primary)' }}>{speed}%</span>
          </label>
          <input 
            type="range" 
            min="1" max="100" 
            value={speed} 
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="styled-slider"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
          <button 
            className="btn btn-primary" 
            onClick={toggleTracing}
          >
            {isTracing ? <><Square size={18} fill="currentColor"/> Dừng Quét</> : <><Play size={18} fill="currentColor"/> Bắt Đầu Quét</>}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleGenerateMaze}
            disabled={isTracing}
          >
            <RefreshCw size={18}/> Tạo Bản Đồ Mới
          </button>
        </div>

        <div className="status-panel">
          <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>
            So sánh đồng thời 4 thuật toán trên cùng một cấu trúc bản đồ.
          </p>
          <div className="stat-box" style={{ marginTop: '10px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px' }}>
            <span className="stat-label">Mã Bản Đồ</span>
            <span className="stat-value">{seed}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area - 2x2 Grid */}
      <main className="main-area">
        <div className="multi-board-layout">
          {algorithms.map((algo) => (
            <MazeBoard 
              key={algo.id}
              title={algo.title}
              algorithmId={algo.id}
              grid={grid}
              startNode={startNode}
              endNode={endNode}
              speed={speed}
              isTracing={isTracing}
              traceTrigger={traceTrigger}
              onComplete={handleBoardComplete}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
