import React from 'react';
import { ControlPanel } from './components/ControlPanel/ControlPanel';
import { MiniDashboard } from './components/Dashboard/MiniDashboard';
import { Board } from './components/Board/Board';
import { usePathfinding } from './hooks/usePathfinding';

function App() {
  const {
    baseGrid, setBaseGrid,
    startNode, setStartNode,
    endNode, setEndNode,
    isRunning, isPaused, togglePause,
    speed, updateSpeed,
    stats, clearPath, startAlgorithms
  } = usePathfinding();

  // Khai báo 4 thuật toán để render
  const algorithms = [
    { id: 'dfs', title: 'DFS (Quay lui)' },
    { id: 'bfs', title: 'BFS (Loang)' },
    { id: 'dijkstra', title: 'Dijkstra (Định tuyến)' },
    { id: 'astar', title: 'A* (Heuristic)' }
  ];

  return (
    <div className="app-container">
      <ControlPanel 
        speed={speed} updateSpeed={updateSpeed}
        isRunning={isRunning} isPaused={isPaused} togglePause={togglePause}
        startAlgorithms={startAlgorithms} clearPath={clearPath}
        setBaseGrid={setBaseGrid} startNode={startNode} endNode={endNode}
      />
      
      <main className="main-content">
        {algorithms.map(algo => (
          <div key={algo.id} className="board-wrapper">
            <MiniDashboard title={algo.title} stats={stats[algo.id]} />
            <Board 
              algoId={algo.id}
              baseGrid={baseGrid}
              startNode={startNode}
              endNode={endNode}
              setBaseGrid={setBaseGrid}
              setStartNode={setStartNode}
              setEndNode={setEndNode}
              isRunning={isRunning}
            />
          </div>
        ))}
      </main>
    </div>
  );
}

export default App;
