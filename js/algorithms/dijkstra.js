async function runDijkstra() {
    let pq = [{ r: startNode.r, c: startNode.c, cost: 0, path: [] }];
    let dist = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
    dist[startNode.r][startNode.c] = 0;
    let visitedNodes = 0;

    while (pq.length > 0) {
        pq.sort((a, b) => a.cost - b.cost); 
        const current = pq.shift();
        const { r, c, cost, path } = current;

        if (grid[r][c].isVisited) continue;
        grid[r][c].isVisited = true;
        
        visitedNodes++;
        statVisited.innerText = visitedNodes;

        if (r !== startNode.r || c !== startNode.c) {
            const el = getNodeEl(r, c);
            el.classList.remove('processing');
            el.classList.add('visited');
            if (r !== endNode.r || c !== endNode.c) {
                el.innerHTML = `<span class="cost-text" style="font-size: 8px;">${cost}</span>`;
            }
        }

        if (r === endNode.r && c === endNode.c) {
            return { path: [...path, {r, c}], cost: cost };
        }

        const neighbors = getNeighbors(r, c);
        for (const n of neighbors) {
            const altCost = cost + grid[n.r][n.c].weight;
            if (altCost < dist[n.r][n.c]) {
                dist[n.r][n.c] = altCost;
                pq.push({ r: n.r, c: n.c, cost: altCost, path: [...path, {r, c}] });
                
                if (n.r !== endNode.r || n.c !== endNode.c) {
                    getNodeEl(n.r, n.c).classList.add('processing');
                }
            }
        }
        await sleep();
    }
    return null;
}
