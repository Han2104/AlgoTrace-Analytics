import { getNeighbors, updateNodeDOM } from '../utils/boardUtils';

/**
 * Breadth-First Search (BFS) pathfinding algorithm.
 *
 * BFS explores a graph level by level, guaranteeing the shortest path in
 * unweighted graphs. It uses a FIFO queue to process nodes in the order they
 * are discovered. This implementation also handles weighted nodes (cost is
 * accumulated) and provides real-time DOM updates for visualization.
 *
 * How it works:
 *  1. Enqueue the start node with an empty path and zero cost.
 *  2. Dequeue a node — if it is the target, return the path and cost.
 *  3. Mark the node as visited and update the UI.
 *  4. Iterate over unvisited neighbors, mark them visited, enqueue them
 *     with the updated path and cost, and highlight them as "processing".
 *  5. Repeat steps 2–4 until the queue is empty (no path found) or the
 *     target is reached.
 *
 * @param {string}   algoId      - Unique DOM element ID prefix for this algorithm instance.
 * @param {Array[]}  baseGrid    - 2-D array of node objects (each has .r, .c, .weight, etc.).
 * @param {{r:number,c:number}} startNode - Starting cell coordinates.
 * @param {{r:number,c:number}} endNode   - Target cell coordinates.
 * @param {Function} sleep       - Async function that yields control (e.g. setTimeout wrapper).
 * @param {Function} updateStats - Callback to refresh stats (visited count, cost, status).
 * @returns {Promise<{path:{r:number,c:number}[], cost:number}|null>}
 *   The found path and total cost, or null if no path exists.
 */
export const runBFS = async (algoId, baseGrid, startNode, endNode, sleep, updateStats) => {
  const startTime = performance.now();
  let nodesProcessedInFrame = 0;
  const batchSize = 15;
  /* ------------------------------------------------------------------
   * 1. Initialisation
   *    The queue holds objects: { r, c, path[], cost }.
   *    path[] tracks every step taken to reach (r, c).
   *    We deep-clone the grid to avoid mutating the caller's copy and
   *    attach a transient `isVisited` flag to each node.
   * ------------------------------------------------------------------ */
  let queue = [{ r: startNode.r, c: startNode.c, path: [], cost: 0 }];
  let grid = baseGrid.map(row => row.map(n => ({ ...n, isVisited: false })));

  grid[startNode.r][startNode.c].isVisited = true;
  let visitedNodes = 0;

  /* ------------------------------------------------------------------
   * 2. BFS loop
   *    Continue until every reachable node has been explored.
   * ------------------------------------------------------------------ */
  while (queue.length > 0) {
    // Dequeue the front of the FIFO queue.
    const current = queue.shift();
    const { r, c, path, cost } = current;

    // ── Stats ──────────────────────────────────────────────────────
    visitedNodes++;
    nodesProcessedInFrame++;
    updateStats({ visited: visitedNodes, cost: 0, status: 'Đang chạy...', time: (performance.now() - startTime).toFixed(2) });

    // ── Visual feedback ────────────────────────────────────────────
    // Move this node from "processing" (pending) to "visited" (done).
    if (r !== startNode.r || c !== startNode.c) {
      updateNodeDOM(algoId, r, c, ['visited'], ['processing']);
    }

    // ── Goal check ─────────────────────────────────────────────────
    if (r === endNode.r && c === endNode.c) {
      const elapsed = (performance.now() - startTime).toFixed(2);
      updateStats({ visited: visitedNodes, cost: cost, status: 'Hoàn thành', time: elapsed });
      // Reconstruct the full path by appending the goal cell.
      return { path: [...path, { r, c }], cost: cost, time: elapsed };
    }

    // ── Neighbour exploration ──────────────────────────────────────
    const neighbors = getNeighbors(grid, r, c);
    for (const n of neighbors) {
      if (!grid[n.r][n.c].isVisited) {
        // Mark immediately so it is never re-enqueued.
        grid[n.r][n.c].isVisited = true;

        // Accumulate cost (allows weighted BFS-like behaviour).
        const newCost = cost + grid[n.r][n.c].weight;

        // Enqueue with the path extended to include the current cell.
        queue.push({ r: n.r, c: n.c, path: [...path, { r, c }], cost: newCost });

        // Highlight as "processing" unless it is the goal.
        if (n.r !== endNode.r || n.c !== endNode.c) {
          updateNodeDOM(algoId, n.r, n.c, ['processing']);
        }
      }
    }

    // Yield control so the UI can re-render between iterations.
    if (nodesProcessedInFrame % batchSize === 0) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      nodesProcessedInFrame = 0;
    }
  }

  /* ------------------------------------------------------------------
   * 3. No path found
   *    The queue drained without ever reaching endNode.
   * ------------------------------------------------------------------ */
  return null;
};
