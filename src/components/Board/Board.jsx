import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Node } from './Node';

export const Board = ({ algoId, baseGrid, startNode, endNode, setBaseGrid, setStartNode, setEndNode, isRunning }) => {
  const containerRef = useRef(null);
  const isMouseDown = useRef(false);
  const draggedNode = useRef(null);
  const rows = baseGrid.length || 24;
  const cols = baseGrid[0]?.length || 40;
  const [cellSize, setCellSize] = useState(10);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateCellSize = () => {
      const { width, height } = container.getBoundingClientRect();
      const safePadding = 24;
      const gridBorder = 8;
      const gridPadding = 8;
      const gridGapsX = Math.max(0, cols - 1);
      const gridGapsY = Math.max(0, rows - 1);
      const availableWidth = width - safePadding - gridBorder - gridPadding - gridGapsX;
      const availableHeight = height - safePadding - gridBorder - gridPadding - gridGapsY;
      const nextSize = Math.max(4, Math.floor(Math.min(availableWidth / cols, availableHeight / rows)));

      setCellSize(prev => (prev === nextSize ? prev : nextSize));
    };

    updateCellSize();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateCellSize);
      return () => window.removeEventListener('resize', updateCellSize);
    }

    const resizeObserver = new ResizeObserver(updateCellSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [cols, rows]);

  const gridStyle = useMemo(() => ({
    '--cell-size': `${cellSize}px`,
    gridTemplateColumns: `repeat(${cols}, var(--cell-size))`,
    gridTemplateRows: `repeat(${rows}, var(--cell-size))`,
  }), [cellSize, cols, rows]);

  const toggleWall = useCallback((r, c) => {
    setBaseGrid(prev => {
      const newGrid = [...prev];
      newGrid[r] = [...newGrid[r]];
      const node = newGrid[r][c];

      newGrid[r][c] = {
        ...node,
        weight: node.weight > 1 ? 1 : node.weight,
        isWall: !node.isWall,
      };

      return newGrid;
    });
  }, [setBaseGrid]);

  const handleMouseDown = useCallback((r, c) => {
    if (isRunning) return;
    isMouseDown.current = true;
    
    if (r === startNode.r && c === startNode.c) {
      draggedNode.current = 'start';
    } else if (r === endNode.r && c === endNode.c) {
      draggedNode.current = 'end';
    } else {
      toggleWall(r, c);
    }
  }, [endNode.c, endNode.r, isRunning, startNode.c, startNode.r, toggleWall]);

  const handleMouseEnter = useCallback((r, c) => {
    if (!isMouseDown.current || isRunning) return;

    if (draggedNode.current === 'start') {
      if (r === endNode.r && c === endNode.c) return;
      setStartNode({ r, c });
    } else if (draggedNode.current === 'end') {
      if (r === startNode.r && c === startNode.c) return;
      setEndNode({ r, c });
    } else {
      if ((r === startNode.r && c === startNode.c) || (r === endNode.r && c === endNode.c)) return;
      toggleWall(r, c);
    }
  }, [endNode.c, endNode.r, isRunning, setEndNode, setStartNode, startNode.c, startNode.r, toggleWall]);

  const handleMouseUp = useCallback(() => {
    isMouseDown.current = false;
    draggedNode.current = null;
  }, []);

  return (
    <div className="grid-container" ref={containerRef} onMouseLeave={handleMouseUp}>
      <div 
        className="grid" 
        style={gridStyle}
      >
        {baseGrid.map((row, r) => 
          row.map((node, c) => {
            const isStart = r === startNode.r && c === startNode.c;
            const isEnd = r === endNode.r && c === endNode.c;
            return (
              <Node
                key={`${algoId}-${r}-${c}`}
                id={`node-${algoId}-${r}-${c}`}
                r={r}
                c={c}
                isWall={node.isWall}
                isStart={isStart}
                isEnd={isEnd}
                weight={node.weight}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
                onMouseUp={handleMouseUp}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
