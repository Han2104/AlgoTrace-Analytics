import React, { memo } from 'react';

export const Node = memo(({ 
  id, r, c, isWall, isStart, isEnd, weight, 
  onMouseDown, onMouseEnter, onMouseUp 
}) => {
  let extraClass = '';
  if (isStart) extraClass = 'start';
  else if (isEnd) extraClass = 'end';
  else if (isWall) extraClass = 'wall';
  else if (weight > 1) extraClass = `weight-${weight}`;

  return (
    <div
      id={id}
      className={`node ${extraClass}`}
      onMouseDown={() => onMouseDown(r, c)}
      onMouseEnter={() => onMouseEnter(r, c)}
      onMouseUp={onMouseUp}
    >
      {weight > 1 && !isStart && !isEnd && !isWall && (
        <span className="cost-text">{weight}</span>
      )}
    </div>
  );
});
