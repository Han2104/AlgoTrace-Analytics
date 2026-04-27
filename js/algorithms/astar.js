function heuristic(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

async function runAStar() {
    let pq = [{ r: startNode.r, c: startNode.c, g: 0, h: 0, f: 0, path: [] }];
    let gScore = Array(ROWS).fill().map(() => Array(COLS).fill(Infinity));
    gScore[startNode.r][startNode.c] = 0;
    let visitedNodes = 0;

    while (pq.length > 0) {
        pq.sort((a, b) => a.f - b.f);
        const current = pq.shift();
        const { r, c, g, path } = current;

        if (grid[r][c].isVisited) continue;
        grid[r][c].isVisited = true;
        
        visitedNodes++;
        statVisited.innerText = visitedNodes;

        if (r !== startNode.r || c !== startNode.c) {
            const el = getNodeEl(r, c);
            el.classList.remove('processing');
            el.classList.add('visited');
            if (r !== endNode.r || c !== endNode.c) {
                el.innerHTML = `<span class="cost-text" style="font-size: 7px; line-height: 1;">f:${current.f}<br>g:${g}</span>`;
            }
        }

        if (r === endNode.r && c === endNode.c) {
            return { path: [...path, {r, c}], cost: g };
        }

        const neighbors = getNeighbors(r, c);
        for (const n of neighbors) {
            if (grid[n.r][n.c].isVisited) continue;

            const tentativeG = g + grid[n.r][n.c].weight;
            if (tentativeG < gScore[n.r][n.c]) {
                gScore[n.r][n.c] = tentativeG;
                const h = heuristic(n.r, n.c, endNode.r, endNode.c) * 10; 
                const f = tentativeG + h;
                
                pq.push({ r: n.r, c: n.c, g: tentativeG, h: h, f: f, path: [...path, {r, c}] });
                
                if (n.r !== endNode.r || n.c !== endNode.c) {
                    getNodeEl(n.r, n.c).classList.add('processing');
                }
            }
        }
        await sleep();
    }
    return null;
}
