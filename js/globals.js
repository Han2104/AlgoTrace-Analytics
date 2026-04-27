const ROWS = 20;
const COLS = 40;

// Grid and Nodes
let grid = [];
let startNode = { r: 10, c: 5 };
let endNode = { r: 10, c: 34 };

// State
let isRunning = false;
let isPaused = false;
let pauseResolve = null;
let speed = 50;

// Dashboard DOM Elements 
// (Will be initialized in main.js, but declared here to share across modules)
let statStatus;
let statVisited;
let statCost;

function getNodeEl(r, c) {
    return document.getElementById(`node-${r}-${c}`);
}

async function sleep() {
    if (isPaused) {
        await new Promise(resolve => pauseResolve = resolve);
    }
    return new Promise(resolve => setTimeout(resolve, speed));
}

// Get neighbors (Up, Right, Down, Left)
function getNeighbors(r, c) {
    const neighbors = [];
    if (r > 0) neighbors.push({ r: r - 1, c: c });
    if (c < COLS - 1) neighbors.push({ r: r, c: c + 1 });
    if (r < ROWS - 1) neighbors.push({ r: r + 1, c: c });
    if (c > 0) neighbors.push({ r: r, c: c - 1 });
    return neighbors.filter(n => !grid[n.r][n.c].isWall);
}

// Draw Final Path
async function animatePath(path, cost) {
    statStatus.innerText = 'Hoàn thành';
    statCost.innerText = cost;
    for (let i = path.length - 2; i > 0; i--) {
        const node = path[i];
        const el = getNodeEl(node.r, node.c);
        el.classList.add('path');
        await sleep();
    }
}
