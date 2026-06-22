import React, { useRef } from 'react';
import { Node } from './Node';

export const Board = ({ algoId, baseGrid, startNode, endNode, setBaseGrid, setStartNode, setEndNode, isRunning }) => {
  const isMouseDown = useRef(false);
  const draggedNode = useRef(null);

  const handleMouseDown = (r, c) => {
    if (isRunning) return;
    isMouseDown.current = true;
    
    if (r === startNode.r && c === startNode.c) {
      draggedNode.current = 'start';
    } else if (r === endNode.r && c === endNode.c) {
      draggedNode.current = 'end';
    } else {
      toggleWall(r, c);
    }
  };

  const handleMouseEnter = (r, c) => {
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
  };

  const handleMouseUp = () => {
    isMouseDown.current = false;
    draggedNode.current = null;
  };

  const toggleWall = (r, c) => {
    setBaseGrid(prev => {
      const newGrid = [...prev];
      newGrid[r] = [...newGrid[r]];
      const node = newGrid[r][c];
      
      if (node.weight > 1) {
        node.weight = 1;
      }
      node.isWall = !node.isWall;
      return newGrid;
    });
  };

  return (
    <div className="grid-container" onMouseLeave={handleMouseUp}>
      <div 
        className="grid" 
        style={{ gridTemplateColumns: `repeat(${baseGrid[0]?.length || 40}, 10px)`, gridTemplateRows: `repeat(${baseGrid.length || 24}, 10px)` }}
      >
        {baseGrid.map((row, r) => 
          row.map((node, c) => {
            const isStart = r === startNode.r && c === startNode.c;
            const isEnd = r === endNode.r && c === endNode.c;
            return (
              <Node
                key={`${algoId}-${r}-${c}`}
                id={`node-${algoId}-${r}-${c}`}
                isWall={node.isWall}
                isStart={isStart}
                isEnd={isEnd}
                weight={node.weight}
                onMouseDown={() => handleMouseDown(r, c)}
                onMouseEnter={() => handleMouseEnter(r, c)}
                onMouseUp={handleMouseUp}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
