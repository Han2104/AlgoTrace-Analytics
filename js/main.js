// DOM Elements
const algoSelect = document.getElementById('algorithm');
const speedSlider = document.getElementById('speed');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnClearPath = document.getElementById('btn-clear-path');
const btnClearBoard = document.getElementById('btn-clear-board');
const btnGenMaze = document.getElementById('btn-gen-maze');
const btnGenWeights = document.getElementById('btn-gen-weights');

// Initialize globals from DOM
statStatus = document.getElementById('stat-status');
statVisited = document.getElementById('stat-visited');
statCost = document.getElementById('stat-cost');

function setupEventListeners() {
    speedSlider.addEventListener('input', (e) => {
        speed = 200 - (e.target.value * 1.9); 
    });
    speed = 200 - (50 * 1.9);

    btnStart.addEventListener('click', startAlgorithm);
    
    btnPause.addEventListener('click', () => {
        isPaused = !isPaused;
        if (isPaused) {
            btnPause.innerText = 'Tiếp tục';
            statStatus.innerText = 'Tạm dừng';
        } else {
            btnPause.innerText = 'Dừng';
            statStatus.innerText = 'Đang chạy...';
            if (pauseResolve) pauseResolve();
        }
    });

    btnClearPath.addEventListener('click', () => {
        if (isRunning) return;
        clearPath();
    });

    btnClearBoard.addEventListener('click', () => {
        if (isRunning) return;
        createGrid();
        statVisited.innerText = '0';
        statCost.innerText = '0';
        statStatus.innerText = 'Sẵn sàng';
    });

    btnGenMaze.addEventListener('click', () => {
        if (isRunning) return;
        generateMaze();
    });

    btnGenWeights.addEventListener('click', () => {
        if (isRunning) return;
        generateWeights();
    });
}

async function startAlgorithm() {
    if (isRunning) return;
    clearPath();
    isRunning = true;
    btnStart.disabled = true;
    btnPause.disabled = false;
    statStatus.innerText = 'Đang chạy...';

    const algo = algoSelect.value;
    let pathFound = null;

    try {
        if (algo === 'dfs') pathFound = await runDFS();
        else if (algo === 'bfs') pathFound = await runBFS();
        else if (algo === 'dijkstra') pathFound = await runDijkstra();
        else if (algo === 'astar') pathFound = await runAStar();

        if (pathFound && pathFound.path) {
            await animatePath(pathFound.path, pathFound.cost);
        } else {
            statStatus.innerText = 'Không tìm thấy đường';
        }
    } catch (e) {
        console.error(e);
    } finally {
        isRunning = false;
        btnStart.disabled = false;
        btnPause.disabled = true;
        if (isPaused) {
            isPaused = false;
            btnPause.innerText = 'Dừng';
        }
    }
}

// Khởi chạy ứng dụng
initGrid();
setupEventListeners();
