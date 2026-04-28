// Hàm helper lấy láng giềng
const getNeighbors = (grid, r, c) => {
    const rows = grid.length;
    const cols = grid[0].length;
    const neighbors = [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Lên, Xuống, Trái, Phải
    
    for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        // 1 is wall, other values are walkable (0: empty, 2: weight 5, 3: weight 10)
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] !== 1) {
            neighbors.push({r: nr, c: nc});
        }
    }
    return neighbors;
};

// Truy xuất đường đi
const backtrackPath = (cameFrom, current) => {
    const path = [];
    let currKey = `${current.r},${current.c}`;
    while (cameFrom[currKey]) {
        path.push(cameFrom[currKey].curr);
        currKey = cameFrom[currKey].prev;
    }
    return path.reverse();
};

export const runAlgorithm = (algorithm, grid, startNode, endNode) => {
    switch (algorithm) {
        case 'astar': return astar(grid, startNode, endNode);
        case 'bfs': return bfs(grid, startNode, endNode);
        case 'dfs': return dfs(grid, startNode, endNode);
        case 'dijkstra': return dijkstra(grid, startNode, endNode);
        case 'random': return randomizedTrace(grid, startNode, endNode);
        default: return bfs(grid, startNode, endNode);
    }
};

const astar = (grid, startNode, endNode) => {
    const visitedNodes = [];
    const cameFrom = {};
    const gScore = { [`${startNode.r},${startNode.c}`]: 0 };
    const fScore = { [`${startNode.r},${startNode.c}`]: heuristic(startNode, endNode) };
    
    const openSet = [startNode];
    const openSetKeys = new Set([`${startNode.r},${startNode.c}`]);
    const closedSet = new Set(); // To prevent infinite loops

    while (openSet.length > 0) {
        // Lấy node có fScore nhỏ nhất
        openSet.sort((a, b) => (fScore[`${a.r},${a.c}`] || Infinity) - (fScore[`${b.r},${b.c}`] || Infinity));
        const current = openSet.shift();
        const currKey = `${current.r},${current.c}`;
        openSetKeys.delete(currKey);

        if (closedSet.has(currKey)) continue;
        closedSet.add(currKey);
        visitedNodes.push(current);

        if (current.r === endNode.r && current.c === endNode.c) {
            return { visitedNodes, path: backtrackPath(cameFrom, current) };
        }

        const neighbors = getNeighbors(grid, current.r, current.c);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.r},${neighbor.c}`;
            if (closedSet.has(neighborKey)) continue;

            const cellType = grid[neighbor.r][neighbor.c];
            const weight = cellType === 2 ? 5 : (cellType === 3 ? 10 : 1);
            const tentativeGScore = gScore[currKey] + weight;

            if (tentativeGScore < (gScore[neighborKey] || Infinity)) {
                cameFrom[neighborKey] = { prev: currKey, curr: neighbor };
                gScore[neighborKey] = tentativeGScore;
                fScore[neighborKey] = tentativeGScore + heuristic(neighbor, endNode);
                
                if (!openSetKeys.has(neighborKey)) {
                    openSet.push(neighbor);
                    openSetKeys.add(neighborKey);
                }
            }
        }
    }
    return { visitedNodes, path: [] };
};

const heuristic = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c);

const bfs = (grid, startNode, endNode) => {
    const visitedNodes = [];
    const cameFrom = {};
    const queue = [startNode];
    const visited = new Set([`${startNode.r},${startNode.c}`]);

    while (queue.length > 0) {
        const current = queue.shift();
        visitedNodes.push(current);

        if (current.r === endNode.r && current.c === endNode.c) {
            return { visitedNodes, path: backtrackPath(cameFrom, current) };
        }

        const neighbors = getNeighbors(grid, current.r, current.c);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.r},${neighbor.c}`;
            if (!visited.has(neighborKey)) {
                visited.add(neighborKey);
                cameFrom[neighborKey] = { prev: `${current.r},${current.c}`, curr: neighbor };
                queue.push(neighbor);
            }
        }
    }
    return { visitedNodes, path: [] };
};

const dfs = (grid, startNode, endNode) => {
    const visitedNodes = [];
    const cameFrom = {};
    const stack = [startNode];
    const visited = new Set([`${startNode.r},${startNode.c}`]);

    while (stack.length > 0) {
        const current = stack.pop();
        visitedNodes.push(current);

        if (current.r === endNode.r && current.c === endNode.c) {
            return { visitedNodes, path: backtrackPath(cameFrom, current) };
        }

        const neighbors = getNeighbors(grid, current.r, current.c);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.r},${neighbor.c}`;
            if (!visited.has(neighborKey)) {
                visited.add(neighborKey);
                cameFrom[neighborKey] = { prev: `${current.r},${current.c}`, curr: neighbor };
                stack.push(neighbor);
            }
        }
    }
    return { visitedNodes, path: [] };
};

const dijkstra = (grid, startNode, endNode) => {
    const visitedNodes = [];
    const cameFrom = {};
    const gScore = { [`${startNode.r},${startNode.c}`]: 0 };
    
    const openSet = [startNode];
    const openSetKeys = new Set([`${startNode.r},${startNode.c}`]);
    const closedSet = new Set();

    while (openSet.length > 0) {
        openSet.sort((a, b) => (gScore[`${a.r},${a.c}`] || Infinity) - (gScore[`${b.r},${b.c}`] || Infinity));
        const current = openSet.shift();
        const currKey = `${current.r},${current.c}`;
        openSetKeys.delete(currKey);

        if (closedSet.has(currKey)) continue;
        closedSet.add(currKey);
        visitedNodes.push(current);

        if (current.r === endNode.r && current.c === endNode.c) {
            return { visitedNodes, path: backtrackPath(cameFrom, current) };
        }

        const neighbors = getNeighbors(grid, current.r, current.c);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.r},${neighbor.c}`;
            if (closedSet.has(neighborKey)) continue;

            const cellType = grid[neighbor.r][neighbor.c];
            const weight = cellType === 2 ? 5 : (cellType === 3 ? 10 : 1);
            const tentativeGScore = gScore[currKey] + weight;

            if (tentativeGScore < (gScore[neighborKey] || Infinity)) {
                cameFrom[neighborKey] = { prev: currKey, curr: neighbor };
                gScore[neighborKey] = tentativeGScore;
                
                if (!openSetKeys.has(neighborKey)) {
                    openSet.push(neighbor);
                    openSetKeys.add(neighborKey);
                }
            }
        }
    }
    return { visitedNodes, path: [] };
};

// Thuật toán trace ngẫu nhiên
const randomizedTrace = (grid, startNode, endNode) => {
    const visitedNodes = [];
    const cameFrom = {};
    const queue = [startNode];
    const visited = new Set([`${startNode.r},${startNode.c}`]);

    while (queue.length > 0) {
        // Chọn một node ngẫu nhiên từ queue thay vì pop hoặc shift
        const randomIndex = Math.floor(Math.random() * queue.length);
        const current = queue.splice(randomIndex, 1)[0];
        
        visitedNodes.push(current);

        if (current.r === endNode.r && current.c === endNode.c) {
            return { visitedNodes, path: backtrackPath(cameFrom, current) };
        }

        const neighbors = getNeighbors(grid, current.r, current.c);
        // Trộn ngẫu nhiên láng giềng
        neighbors.sort(() => Math.random() - 0.5);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.r},${neighbor.c}`;
            if (!visited.has(neighborKey)) {
                visited.add(neighborKey);
                cameFrom[neighborKey] = { prev: `${current.r},${current.c}`, curr: neighbor };
                queue.push(neighbor);
            }
        }
    }
    return { visitedNodes, path: [] };
};
