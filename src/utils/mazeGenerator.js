export function generateMap(type, rows, cols) {
    switch (type) {
        case 'warehouse': return generateWarehouse(rows, cols);
        case 'network': return generateNetwork(rows, cols);
        case 'weighted': return generateWeighted(rows, cols);
        case 'maze': 
        default: return generateMaze(rows, cols);
    }
}

function generateMaze(rows, cols) {
    const grid = Array(rows).fill().map(() => Array(cols).fill(1));
    const getNeighbors = (r, c) => {
        const neighbors = [];
        if (r > 1) neighbors.push([r - 2, c, r - 1, c]);
        if (r < rows - 2) neighbors.push([r + 2, c, r + 1, c]);
        if (c > 1) neighbors.push([r, c - 2, r, c - 1]);
        if (c < cols - 2) neighbors.push([r, c + 2, r, c + 1]);
        return neighbors.sort(() => Math.random() - 0.5);
    };

    let startR = Math.floor(Math.random() * (rows / 2)) * 2;
    let startC = Math.floor(Math.random() * (cols / 2)) * 2;
    if (startR >= rows) startR = rows - 2;
    if (startC >= cols) startC = cols - 2;

    grid[startR][startC] = 0;
    const stack = [[startR, startC]];

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const [r, c] = current;
        const neighbors = getNeighbors(r, c);
        
        let found = false;
        for (const [nr, nc, pr, pc] of neighbors) {
            if (grid[nr][nc] === 1) {
                grid[pr][pc] = 0;
                grid[nr][nc] = 0;
                stack.push([nr, nc]);
                found = true;
                break;
            }
        }
        if (!found) stack.pop();
    }

    for(let i=0; i< (rows*cols)/10; i++) {
        let r = Math.floor(Math.random() * (rows-2)) + 1;
        let c = Math.floor(Math.random() * (cols-2)) + 1;
        grid[r][c] = 0;
    }
    return grid;
}

function generateWarehouse(rows, cols) {
    const grid = Array(rows).fill().map(() => Array(cols).fill(0));
    
    // Create rectangular shelves
    for (let r = 2; r < rows - 2; r += 4) {
        for (let c = 2; c < cols - 2; c += 5) {
            // Shelf size 2x3
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 3; j++) {
                    if (r + i < rows && c + j < cols) {
                        grid[r + i][c + j] = 1;
                    }
                }
            }
        }
    }
    return grid;
}

function generateNetwork(rows, cols) {
    const grid = Array(rows).fill().map(() => Array(cols).fill(0));
    
    // Add random scattered small walls
    for(let i=0; i< (rows*cols)/4; i++) {
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * cols);
        grid[r][c] = 1;
    }
    
    // Ensure boundary has some openings
    return grid;
}

function generateWeighted(rows, cols) {
    // 0: empty, 1: wall, 2: light weight, 3: heavy weight
    const grid = Array(rows).fill().map(() => Array(cols).fill(0));
    
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            const rand = Math.random();
            if (rand < 0.1) grid[r][c] = 1; // 10% walls
            else if (rand < 0.3) grid[r][c] = 2; // 20% light weight
            else if (rand < 0.45) grid[r][c] = 3; // 15% heavy weight
        }
    }
    return grid;
}

export function getRandomPositions(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    let emptyCells = [];
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] !== 1) {
                emptyCells.push({r, c});
            }
        }
    }
    
    if (emptyCells.length === 0) {
        grid[0][0] = 0;
        grid[rows-1][cols-1] = 0;
        return { startNode: {r:0, c:0}, endNode: {r:rows-1, c:cols-1} };
    }
    if (emptyCells.length === 1) {
        grid[rows-1][cols-1] = 0;
        return { startNode: emptyCells[0], endNode: {r:rows-1, c:cols-1} };
    }

    // Shuffle
    emptyCells.sort(() => Math.random() - 0.5);
    const startNode = emptyCells[0];
    
    // Find furthest node
    let endNode = emptyCells[1];
    let maxDist = -1;

    for (let i = 1; i < emptyCells.length; i++) {
        const dist = Math.abs(emptyCells[i].r - startNode.r) + Math.abs(emptyCells[i].c - startNode.c);
        if (dist > maxDist) {
            maxDist = dist;
            endNode = emptyCells[i];
        }
    }

    return { startNode, endNode };
}
