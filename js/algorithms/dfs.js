async function runDFS() {
    let stack = [{ r: startNode.r, c: startNode.c, path: [], cost: 0 }];
    let visitedNodes = 0;
    
    while (stack.length > 0) {
        const current = stack.pop();
        const { r, c, path, cost } = current;
        
        if (grid[r][c].isVisited) continue;
        
        grid[r][c].isVisited = true;
        visitedNodes++;
        statVisited.innerText = visitedNodes;
        
        const newPath = [...path, {r, c}];
        const newCost = cost + grid[r][c].weight;
        
        const el = getNodeEl(r, c);
        if (r !== startNode.r || c !== startNode.c) {
            el.classList.add('visited');
        }

        if (r === endNode.r && c === endNode.c) {
            return { path: newPath, cost: newCost };
        }
        
        await sleep();
        
        const neighbors = getNeighbors(r, c);
        let unvisitedCount = 0;
        
        for (let i = neighbors.length - 1; i >= 0; i--) {
            const n = neighbors[i];
            if (!grid[n.r][n.c].isVisited) {
                stack.push({ r: n.r, c: n.c, path: newPath, cost: newCost });
                getNodeEl(n.r, n.c).classList.add('processing');
                unvisitedCount++;
            }
        }
        
        // Show backtracking (dead end)
        if (unvisitedCount === 0 && (r !== startNode.r || c !== startNode.c)) {
            el.classList.remove('visited');
            el.classList.add('backtrack');
            await sleep();
        }
    }
    return null;
}
