import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { runAlgorithm } from '../utils/pathfinding';

const ROWS = 20;
const COLS = 20;
const CELL_SIZE = 16; // Smaller cell size for 2x2 grid

export const MazeBoard = ({ title, algorithmId, grid, startNode, endNode, speed, isTracing, traceTrigger, onComplete }) => {
  const [visitedSet, setVisitedSet] = useState(new Set());
  const [finalPath, setFinalPath] = useState([]);
  const [finalPathSet, setFinalPathSet] = useState(new Set());
  const [status, setStatus] = useState('idle');
  const [stats, setStats] = useState({ pathLength: 0, pathCost: 0, expanded: 0 });
  const [localTraceId, setLocalTraceId] = useState(0);
  const timeoutRefs = useRef([]);

  const clearTimeouts = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  };

  // Reset when grid changes
  useEffect(() => {
    clearTimeouts();
    setVisitedSet(new Set());
    setFinalPath([]);
    setFinalPathSet(new Set());
    setStatus('idle');
    setStats({ pathLength: 0, pathCost: 0, expanded: 0 });
    setLocalTraceId(0);
  }, [grid]);

  // Stop midway if user cancels
  useEffect(() => {
    if (!isTracing && status === 'processing') {
      clearTimeouts();
      setStatus('idle');
    }
  }, [isTracing, status]);

  // Run tracing when traceTrigger increments
  useEffect(() => {
    if (traceTrigger > localTraceId && grid.length > 0 && startNode && endNode) {
      setLocalTraceId(traceTrigger);
      clearTimeouts();
      setStatus('processing');
      setVisitedSet(new Set());
      setFinalPath([]);
      setFinalPathSet(new Set());
      setStats({ pathLength: 0, pathCost: 0, expanded: 0 });

      const result = runAlgorithm(algorithmId, grid, startNode, endNode);
      const { visitedNodes, path } = result;
      
      const delay = Math.max(2, 52 - Math.floor(speed / 2));
      
      visitedNodes.forEach((node, index) => {
        const isEnd = index === visitedNodes.length - 1;
        const tid = setTimeout(() => {
          setVisitedSet(prev => new Set(prev).add(`${node.r},${node.c}`));
          setStats(prev => ({ ...prev, expanded: index + 1 }));
          
          if (isEnd) {
            if (path.length > 0) {
              const fullPath = [startNode, ...path];
              
              let totalCost = 0;
              // Sum up weights of all steps in the path (excluding start node)
              path.forEach(p => {
                const cellType = grid[p.r][p.c];
                if (cellType === 2) totalCost += 5;
                else if (cellType === 3) totalCost += 10;
                else totalCost += 1;
              });

              setFinalPath(fullPath);
              setFinalPathSet(new Set(fullPath.map(p => `${p.r},${p.c}`)));
              setStats(prev => ({ ...prev, pathLength: path.length, pathCost: totalCost }));
              setStatus('success');
            } else {
              setStatus('fail');
            }
            if (onComplete) onComplete();
          }
        }, index * delay);
        timeoutRefs.current.push(tid);
      });
    }
  }, [traceTrigger, localTraceId, algorithmId, grid, startNode, endNode, speed, onComplete]);

  const createSvgPath = () => {
    if (finalPath.length < 2) return '';
    const points = finalPath.map(p => `${p.c * CELL_SIZE + CELL_SIZE/2},${p.r * CELL_SIZE + CELL_SIZE/2}`);
    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="board-container">
      <div className="board-header">
        <h3 className="algo-title">{title}</h3>
        <div className="board-stats">
          <span className="stat-sm">Mở rộng: <strong>{stats.expanded}</strong></span>
          <span className="stat-sm">Bước: <strong>{stats.pathLength}</strong></span>
          <span className="stat-sm">Chi phí: <strong className="highlight" style={{color: '#f59e0b'}}>{stats.pathCost}</strong></span>
        </div>
      </div>
      
      <div className="board-wrapper">
        <div className="grid-container" style={{ width: COLS * CELL_SIZE + 20, height: ROWS * CELL_SIZE + 20, padding: '10px' }}>
          <div 
            className="grid" 
            style={{ 
              gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(${ROWS}, ${CELL_SIZE}px)`
            }}
          >
            {grid.map((row, r) => row.map((cell, c) => {
              const isStart = startNode?.r === r && startNode?.c === c;
              const isEnd = endNode?.r === r && endNode?.c === c;
              const isWall = cell === 1;
              const isWeight2 = cell === 2;
              const isWeight3 = cell === 3;
              const isVisited = visitedSet.has(`${r},${c}`);
              const isPath = finalPathSet.has(`${r},${c}`);
              
              let cellClass = 'cell';
              if (isWall) cellClass += ' wall';
              else if (isPath && !isStart && !isEnd) cellClass += ' path-cell';
              else if (isWeight2) cellClass += ' weight-2';
              else if (isWeight3) cellClass += ' weight-3';

              return (
                <div key={`${r}-${c}`} className={cellClass}>
                  {isWeight2 && <span style={{fontSize: '8px', color: 'rgba(255, 255, 0, 0.7)', fontWeight: 'bold'}}>5</span>}
                  {isWeight3 && <span style={{fontSize: '8px', color: 'rgba(255, 0, 0, 0.7)', fontWeight: 'bold'}}>10</span>}
                  
                  {!isWall && isVisited && !isStart && !isEnd && !isPath && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        width: '100%', height: '100%',
                        backgroundColor: 'rgba(57, 255, 20, 0.15)',
                        borderRadius: '2px',
                        position: 'absolute',
                        zIndex: 1
                      }}
                    />
                  )}
                  {isPath && !isStart && !isEnd && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      style={{
                        width: '100%', height: '100%',
                        backgroundColor: 'rgba(57, 255, 20, 0.6)',
                        boxShadow: '0 0 10px rgba(57, 255, 20, 0.8)',
                        borderRadius: '2px',
                        position: 'absolute',
                        zIndex: 2
                      }}
                    />
                  )}
                  {isStart && <div className="start-sphere" />}
                  {isEnd && <div className="end-cube"><span style={{fontSize: '5px'}}>ĐÍCH</span></div>}
                </div>
              );
            }))}
            
            <svg className="svg-overlay" style={{ top: 0, left: 0, width: '100%', height: '100%' }}>
              <defs>
                <filter id={`neon-glow-${algorithmId}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id={`neon-glow-strong-${algorithmId}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <AnimatePresence>
                {finalPath.length > 0 && (
                  <motion.g>
                    <motion.path
                      d={createSvgPath()}
                      fill="none"
                      stroke="rgba(57, 255, 20, 0.4)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={`url(#neon-glow-strong-${algorithmId})`}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                    <motion.path
                      d={createSvgPath()}
                      fill="none"
                      stroke="#39ff14"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={`url(#neon-glow-${algorithmId})`}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                    <motion.path
                      d={createSvgPath()}
                      fill="none"
                      stroke="#e6ffe6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                  </motion.g>
                )}
              </AnimatePresence>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Board footer status */}
      <div className="board-footer">
        <span className={`status-indicator ${status}`}></span>
        <span>{status === 'idle' ? 'Sẵn sàng' : status === 'processing' ? 'Đang tìm...' : status === 'success' ? 'Đã thấy' : 'Thất bại'}</span>
      </div>
    </div>
  );
};
