async function runBFS() {
    let queue = [{ r: startNode.r, c: startNode.c, path: [], cost: 0 }];
    grid[startNode.r][startNode.c].isVisited = true;
    let visitedNodes = 0;

    while (queue.length > 0) {
        const current = queue.shift();
        const { r, c, path, cost } = current;
        
        visitedNodes++;
        statVisited.innerText = visitedNodes;

        if (r !== startNode.r || c !== startNode.c) {
            getNodeEl(r, c).classList.remove('processing');
            getNodeEl(r, c).classList.add('visited');
        }

        if (r === endNode.r && c === endNode.c) {
            return { path: [...path, {r, c}], cost: cost + grid[r][c].weight };
        }

        const neighbors = getNeighbors(r, c);
        for (const n of neighbors) {
            if (!grid[n.r][n.c].isVisited) {
                grid[n.r][n.c].isVisited = true;
                const newCost = cost + grid[n.r][n.c].weight;
                queue.push({ r: n.r, c: n.c, path: [...path, {r, c}], cost: newCost });
                
                if (n.r !== endNode.r || n.c !== endNode.c) {
                    getNodeEl(n.r, n.c).classList.add('processing');
                }
            }
        }
        await sleep();
    }
    return null;
}
