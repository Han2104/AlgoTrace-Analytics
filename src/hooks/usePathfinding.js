import { useState, useRef, useCallback } from 'react';
import { createInitialGrid, ROWS, COLS, resetDOMGrids, updateNodeDOM } from '../utils/boardUtils';
import { runDFS } from '../algorithms/dfs';
import { runBFS } from '../algorithms/bfs';
import { runDijkstra } from '../algorithms/dijkstra';
import { runAStar } from '../algorithms/astar';

export const usePathfinding = () => {
  const [baseGrid, setBaseGrid] = useState(createInitialGrid());
  const [startNode, setStartNode] = useState({ r: 24, c: 10 });
  const [endNode, setEndNode] = useState({ r: 24, c: 54 });
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(50);
  
  const [stats, setStats] = useState({
    dfs: { visited: 0, cost: 0, status: 'Sẵn sàng' },
    bfs: { visited: 0, cost: 0, status: 'Sẵn sàng' },
    dijkstra: { visited: 0, cost: 0, status: 'Sẵn sàng' },
    astar: { visited: 0, cost: 0, status: 'Sẵn sàng' },
  });

  const speedRef = useRef(100);
  const pauseRef = useRef(false);
  const resolvePauseRef = useRef([]);

  const updateSpeed = (val) => {
    setSpeed(val);
    speedRef.current = 200 - (val * 1.9);
  };

  const togglePause = () => {
    setIsPaused(prev => {
      const next = !prev;
      pauseRef.current = next;
      if (!next && resolvePauseRef.current.length > 0) {
        resolvePauseRef.current.forEach(resolve => resolve());
        resolvePauseRef.current = [];
      }
      return next;
    });
  };

  const sleep = async () => {
    if (pauseRef.current) {
      await new Promise(res => resolvePauseRef.current.push(res));
    }
    return new Promise(res => setTimeout(res, speedRef.current));
  };

  const clearPath = useCallback(() => {
    resetDOMGrids();
    setStats({
      dfs: { visited: 0, cost: 0, status: 'Sẵn sàng' },
      bfs: { visited: 0, cost: 0, status: 'Sẵn sàng' },
      dijkstra: { visited: 0, cost: 0, status: 'Sẵn sàng' },
      astar: { visited: 0, cost: 0, status: 'Sẵn sàng' },
    });
  }, []);

  const startAlgorithms = async () => {
    if (isRunning) return;
    clearPath();
    setIsRunning(true);
    setIsPaused(false);
    pauseRef.current = false;

    // Helper to animate final path
    const animatePath = async (algoId, path, cost) => {
      setStats(prev => ({ ...prev, [algoId]: { ...prev[algoId], cost, status: 'Hoàn thành' } }));
      for (let i = path.length - 2; i > 0; i--) {
        updateNodeDOM(algoId, path[i].r, path[i].c, ['path']);
        await sleep();
      }
    };

    // Helper to update specific algo stat
    const updateStat = (algoId) => (newStats) => {
      setStats(prev => ({ ...prev, [algoId]: { ...prev[algoId], ...newStats } }));
    };

    const runAlgo = async (algoId, runFunc) => {
      try {
        const result = await runFunc(algoId, baseGrid, startNode, endNode, sleep, updateStat(algoId));
        if (result && result.path) {
          await animatePath(algoId, result.path, result.cost);
        } else {
          setStats(prev => ({ ...prev, [algoId]: { ...prev[algoId], status: 'Không tìm thấy' } }));
        }
      } catch (e) {
        console.error(e);
      }
    };

    await Promise.all([
      runAlgo('dfs', runDFS),
      runAlgo('bfs', runBFS),
      runAlgo('dijkstra', runDijkstra),
      runAlgo('astar', runAStar),
    ]);

    setIsRunning(false);
  };

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
