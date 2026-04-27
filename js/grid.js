let isMouseDown = false;
let draggedNode = null; // 'start' or 'end'
let gridContainer;

function initGrid() {
    gridContainer = document.getElementById('grid-container');
    createGrid();
}

function createGrid() {
    gridContainer.innerHTML = '';
    const gridElement = document.createElement('div');
    gridElement.className = 'grid';
    gridElement.style.gridTemplateColumns = `repeat(${COLS}, 25px)`;
    gridElement.style.gridTemplateRows = `repeat(${ROWS}, 25px)`;

    grid = [];
    for (let r = 0; r < ROWS; r++) {
        const row = [];
        for (let c = 0; c < COLS; c++) {
            const nodeInfo = { r, c, isWall: false, weight: 1, isVisited: false };
            row.push(nodeInfo);

            const nodeEl = document.createElement('div');
            nodeEl.id = `node-${r}-${c}`;
            nodeEl.className = 'node';
            
            if (r === startNode.r && c === startNode.c) nodeEl.classList.add('start');
            else if (r === endNode.r && c === endNode.c) nodeEl.classList.add('end');

            // Mouse Events
            nodeEl.addEventListener('mousedown', (e) => handleMouseDown(r, c, e));
            nodeEl.addEventListener('mouseenter', (e) => handleMouseEnter(r, c, e));
            nodeEl.addEventListener('mouseup', handleMouseUp);

            gridElement.appendChild(nodeEl);
        }
        grid.push(row);
    }
    gridContainer.appendChild(gridElement);
    gridContainer.addEventListener('mouseleave', handleMouseUp);
}

function handleMouseDown(r, c, e) {
    e.preventDefault();
    if (isRunning) return;
    isMouseDown = true;
    
    if (r === startNode.r && c === startNode.c) {
        draggedNode = 'start';
    } else if (r === endNode.r && c === endNode.c) {
        draggedNode = 'end';
    } else {
        toggleWall(r, c);
    }
}

function handleMouseEnter(r, c, e) {
    e.preventDefault();
    if (!isMouseDown || isRunning) return;

    if (draggedNode === 'start') {
        if (r === endNode.r && c === endNode.c) return;
        getNodeEl(startNode.r, startNode.c).classList.remove('start');
        startNode = { r, c };
        grid[r][c].isWall = false;
        getNodeEl(r, c).className = 'node start';
    } else if (draggedNode === 'end') {
        if (r === startNode.r && c === startNode.c) return;
        getNodeEl(endNode.r, endNode.c).classList.remove('end');
        endNode = { r, c };
        grid[r][c].isWall = false;
        getNodeEl(r, c).className = 'node end';
    } else {
        if ((r === startNode.r && c === startNode.c) || (r === endNode.r && c === endNode.c)) return;
        toggleWall(r, c);
    }
}

function handleMouseUp() {
    isMouseDown = false;
    draggedNode = null;
}

function toggleWall(r, c) {
    const node = grid[r][c];
    if (node.weight > 1) {
        node.weight = 1;
        getNodeEl(r, c).innerHTML = '';
        getNodeEl(r, c).className = 'node';
    }
    node.isWall = !node.isWall;
    if (node.isWall) {
        getNodeEl(r, c).className = 'node wall';
    } else {
        getNodeEl(r, c).className = 'node';
    }
}

function clearPath() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            grid[r][c].isVisited = false;
            const el = getNodeEl(r, c);
            const isStart = r === startNode.r && c === startNode.c;
            const isEnd = r === endNode.r && c === endNode.c;
            
            if (!isStart && !isEnd && !grid[r][c].isWall) {
                if (grid[r][c].weight > 1) {
                    el.className = `node weight-${grid[r][c].weight}`;
                } else {
                    el.className = 'node';
                }
                el.innerHTML = grid[r][c].weight > 1 ? `<span class="cost-text">${grid[r][c].weight}</span>` : '';
            } else if (isStart) {
                el.innerHTML = '';
            } else if (isEnd) {
                el.innerHTML = '';
            }
        }
    }
    statVisited.innerText = '0';
    statCost.innerText = '0';
    statStatus.innerText = 'Sẵn sàng';
}

function generateWeights() {
    clearPath();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if ((r === startNode.r && c === startNode.c) || (r === endNode.r && c === endNode.c) || grid[r][c].isWall) continue;
            if (Math.random() < 0.3) {
                const w = Math.floor(Math.random() * 3) * 10 + 10; 
                grid[r][c].weight = w;
                const el = getNodeEl(r, c);
                el.className = `node weight-${w}`;
                el.innerHTML = `<span class="cost-text">${w}</span>`;
            } else {
                grid[r][c].weight = 1;
                getNodeEl(r, c).className = 'node';
                getNodeEl(r, c).innerHTML = '';
            }
        }
    }
}

function generateMaze() {
    clearPath();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if ((r === startNode.r && c === startNode.c) || (r === endNode.r && c === endNode.c)) continue;
            grid[r][c].weight = 1;
            getNodeEl(r, c).innerHTML = '';
            if (Math.random() < 0.3) {
                grid[r][c].isWall = true;
                getNodeEl(r, c).className = 'node wall';
            } else {
                grid[r][c].isWall = false;
                getNodeEl(r, c).className = 'node';
            }
        }
    }
}
