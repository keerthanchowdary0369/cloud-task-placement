/**
 * Cloud Task Placement - Interactive Simulation & Visualization Engine
 * Design and Analysis of Algorithms | Woxsen University
 * Authors: Andrew Devasani, Sathyanarayana Varma, G. Daiwik Reddy, G. Keerthan Chowdary
 */

// ==========================================
// 1. PSEUDORANDOM GENERATOR (Deterministic Seed)
// ==========================================
class RandomGenerator {
  constructor(seed = 0) {
    this.s = (seed >>> 0) || 123456789;
  }
  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  uniform(min, max) {
    return min + this.next() * (max - min);
  }
  randint(min, max) {
    return Math.floor(this.uniform(min, max + 1));
  }
  sample(arr, k) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, k);
  }
}

// ==========================================
// 2. CORE GRAPH & ALGORITHM IMPLEMENTATIONS
// ==========================================

class DSU {
  constructor(n) {
    this.p = Array.from({ length: n }, (_, i) => i);
    this.r = new Array(n).fill(0);
  }
  find(x) {
    let root = x;
    while (this.p[root] !== root) root = this.p[root];
    let curr = x;
    while (curr !== root) {
      let nxt = this.p[curr];
      this.p[curr] = root;
      curr = nxt;
    }
    return root;
  }
  union(a, b) {
    let rootA = this.find(a);
    let rootB = this.find(b);
    if (rootA === rootB) return false;
    if (this.r[rootA] < this.r[rootB]) {
      this.p[rootA] = rootB;
    } else {
      this.p[rootB] = rootA;
      if (this.r[rootA] === this.r[rootB]) this.r[rootA]++;
    }
    return true;
  }
}

class MinHeap {
  constructor() {
    this.heap = [];
  }
  push(val) {
    this.heap.push(val);
    this._bubbleUp(this.heap.length - 1);
  }
  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._bubbleDown(0);
    }
    return top;
  }
  size() {
    return this.heap.length;
  }
  _bubbleUp(idx) {
    while (idx > 0) {
      let p = (idx - 1) >> 1;
      if (this.heap[idx][0] < this.heap[p][0]) {
        [this.heap[idx], this.heap[p]] = [this.heap[p], this.heap[idx]];
        idx = p;
      } else break;
    }
  }
  _bubbleDown(idx) {
    const len = this.heap.length;
    while ((idx << 1) + 1 < len) {
      let l = (idx << 1) + 1, r = l + 1, best = l;
      if (r < len && this.heap[r][0] < this.heap[l][0]) best = r;
      if (this.heap[best][0] < this.heap[idx][0]) {
        [this.heap[idx], this.heap[best]] = [this.heap[best], this.heap[idx]];
        idx = best;
      } else break;
    }
  }
}

function generateCloudTopology(n, extraEdgeFactor = 1.0, seed = 0) {
  const rnd = new RandomGenerator(seed);
  const pos = [];
  for (let i = 0; i < n; i++) {
    // Add margin around borders
    pos.push([0.08 + rnd.next() * 0.84, 0.08 + rnd.next() * 0.84]);
  }

  function dist(a, b) {
    const dx = pos[a][0] - pos[b][0];
    const dy = pos[a][1] - pos[b][1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  function lat(a, b) {
    const d = dist(a, b);
    return +(1 + d * 40 + rnd.next() * 2).toFixed(2);
  }

  const adj = Array.from({ length: n }, () => []);
  const edges = [];
  const seen = new Set();

  function add(a, b) {
    if (a === b) return;
    const u = Math.min(a, b), v = Math.max(a, b);
    const key = `${u}-${v}`;
    if (!seen.has(key)) {
      seen.add(key);
      const w = lat(u, v);
      adj[u].push([v, w]);
      adj[v].push([u, w]);
      edges.push([u, v, w]);
    }
  }

  // Guarantee connected tree
  for (let v = 1; v < n; v++) {
    let bestU = 0, bestDist = Infinity;
    for (let u = 0; u < v; u++) {
      const d = dist(u, v);
      if (d < bestDist) {
        bestDist = d;
        bestU = u;
      }
    }
    add(bestU, v);
  }

  // Add extra nearest-neighbour links according to density
  const k = Math.max(0, Math.round(extraEdgeFactor * 3));
  for (let v = 0; v < n; v++) {
    const distances = [];
    for (let u = 0; u < n; u++) {
      if (u !== v) distances.push({ u, d: dist(u, v) });
    }
    distances.sort((a, b) => a.d - b.d);
    for (let i = 0; i < Math.min(k, distances.length); i++) {
      add(v, distances[i].u);
    }
  }

  return { n, pos, adj, edges };
}

function generateWorkload(nServers, nTasks, tightness = 0.8, seed = 0) {
  const rnd = new RandomGenerator(seed + 1000);
  const demand = [];
  const value = [];
  const origin = [];
  let sumDemand = 0;

  for (let i = 0; i < nTasks; i++) {
    const d = rnd.randint(1, 10);
    const v = rnd.randint(5, 60);
    const o = rnd.randint(0, nServers - 1);
    demand.push(d);
    value.push(v);
    origin.push(o);
    sumDemand += d;
  }

  const totalCap = Math.max(nServers * 5, Math.floor(sumDemand / tightness));
  const base = Math.floor(totalCap / nServers);
  const cap = [];

  for (let s = 0; s < nServers; s++) {
    cap.push(Math.max(5, Math.floor(base * rnd.uniform(0.6, 1.4))));
  }

  return { cap, demand, value, origin };
}

function kruskalMST(graph) {
  const dsu = new DSU(graph.n);
  const sortedEdges = [...graph.edges].sort((a, b) => a[2] - b[2]);
  const tree = [];
  let totalWeight = 0;

  for (const [u, v, w] of sortedEdges) {
    if (dsu.union(u, v)) {
      tree.push([u, v, w]);
      totalWeight += w;
    }
  }
  return { totalWeight: +totalWeight.toFixed(2), tree };
}

function primMST(graph, root = 0) {
  const seen = new Array(graph.n).fill(false);
  const tree = [];
  let totalWeight = 0;
  const pq = new MinHeap();
  pq.push([0.0, root, -1]);

  while (pq.size() > 0) {
    const [w, v, par] = pq.pop();
    if (seen[v]) continue;
    seen[v] = true;
    if (par >= 0) {
      tree.push([par, v, w]);
      totalWeight += w;
    }
    for (const [nb, wt] of graph.adj[v]) {
      if (!seen[nb]) {
        pq.push([wt, nb, v]);
      }
    }
  }
  return { totalWeight: +totalWeight.toFixed(2), tree };
}

function dijkstraAPSP(graph) {
  const n = graph.n;
  const matrix = Array.from({ length: n }, () => new Array(n).fill(Infinity));

  for (let src = 0; src < n; src++) {
    const dist = matrix[src];
    dist[src] = 0;
    const pq = new MinHeap();
    pq.push([0.0, src]);

    while (pq.size() > 0) {
      const [d, u] = pq.pop();
      if (d > dist[u]) continue;
      for (const [v, w] of graph.adj[u]) {
        if (d + w < dist[v]) {
          dist[v] = d + w;
          pq.push([d + w, v]);
        }
      }
    }
  }
  return matrix;
}

function knapsack01(values, weights, capacity) {
  const n = values.length;
  const cap = Math.floor(capacity);
  const dp = Array.from({ length: n + 1 }, () => new Float64Array(cap + 1));

  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1];
    const v = values[i - 1];
    const prev = dp[i - 1];
    const curr = dp[i];
    for (let c = 0; c <= cap; c++) {
      curr[c] = prev[c];
      if (w <= c && prev[c - w] + v > curr[c]) {
        curr[c] = prev[c - w] + v;
      }
    }
  }

  const chosen = [];
  let c = cap;
  for (let i = n; i > 0; i--) {
    if (dp[i][c] !== dp[i - 1][c]) {
      chosen.push(i - 1);
      c -= weights[i - 1];
    }
  }
  return { bestValue: dp[n][cap], chosen: chosen.reverse() };
}

// Compute utility: value(t) - lambda * latency(origin, server)
function calcUtility(L, o, p, t, s, lambda = 1.0) {
  return p[t] - lambda * L[o[t]][s];
}

function computeMetrics(assign, L, cap, d, p, o, secs, lambda = 1.0) {
  const placed = [];
  for (let t = 0; t < assign.length; t++) {
    if (assign[t] !== null) placed.push(t);
  }
  let totalUtil = 0;
  let totalLat = 0;
  const used = new Array(cap.length).fill(0);

  for (const t of placed) {
    const s = assign[t];
    totalUtil += calcUtility(L, o, p, t, s, lambda);
    totalLat += L[o[t]][s];
    used[s] += d[t];
  }

  const totalCap = cap.reduce((a, b) => a + b, 0);
  const usedCap = used.reduce((a, b) => a + b, 0);

  return {
    utility: +totalUtil.toFixed(2),
    placedCount: placed.length,
    totalTasks: assign.length,
    placedPct: +((100 * placed.length) / assign.length).toFixed(1),
    avgLatency: placed.length > 0 ? +(totalLat / placed.length).toFixed(2) : 0,
    capUsedPct: +((100 * usedCap) / totalCap).toFixed(1),
    usedCap,
    totalCap,
    secs: +secs.toFixed(4),
    serverUsed: used
  };
}

// 1. Proposed Heuristic: Greedy Proposals + Multi-Round Knapsack DP
function solveGreedyDP(L, cap, d, p, o, lambda = 1.0) {
  const t0 = performance.now();
  const nServers = cap.length;
  const nTasks = d.length;
  const remaining = [...cap];
  const assign = new Array(nTasks).fill(null);
  const banned = Array.from({ length: nTasks }, () => new Set());
  const pending = new Set(Array.from({ length: nTasks }, (_, i) => i));
  const rounds = [];

  let roundNum = 0;
  while (pending.size > 0) {
    roundNum++;
    const proposals = {};
    const roundLog = { round: roundNum, proposalsCount: 0, acceptedCount: 0, rejectedCount: 0 };

    for (const t of pending) {
      let bestUtil = 0;
      let bestServer = null;
      for (let s = 0; s < nServers; s++) {
        if (banned[t].has(s)) continue;
        const u = calcUtility(L, o, p, t, s, lambda);
        if (u > bestUtil) {
          bestUtil = u;
          bestServer = s;
        }
      }
      if (bestServer === null) {
        pending.delete(t); // Discard task if no server yields positive utility
      } else {
        if (!proposals[bestServer]) proposals[bestServer] = [];
        proposals[bestServer].push(t);
        roundLog.proposalsCount++;
      }
    }

    if (Object.keys(proposals).length === 0) break;

    for (const sStr in proposals) {
      const s = parseInt(sStr);
      const taskList = proposals[s];
      const vals = taskList.map(t => calcUtility(L, o, p, t, s, lambda));
      const wts = taskList.map(t => d[t]);

      const { chosen } = knapsack01(vals, wts, remaining[s]);
      const keepSet = new Set(chosen.map(idx => taskList[idx]));

      for (const t of taskList) {
        if (keepSet.has(t)) {
          assign[t] = s;
          remaining[s] -= d[t];
          pending.delete(t);
          roundLog.acceptedCount++;
        } else {
          banned[t].add(s);
          roundLog.rejectedCount++;
        }
      }
    }
    rounds.push(roundLog);
    if (roundNum > nServers) break;
  }

  const elapsedSecs = (performance.now() - t0) / 1000;
  const metrics = computeMetrics(assign, L, cap, d, p, o, elapsedSecs, lambda);
  return { assign, metrics, rounds };
}

// 2. Baseline: Greedy-Nearest (Sorted by value desc, first server with room)
function solveGreedyNearest(L, cap, d, p, o, lambda = 1.0) {
  const t0 = performance.now();
  const remaining = [...cap];
  const assign = new Array(d.length).fill(null);

  const sortedTasks = Array.from({ length: d.length }, (_, i) => i)
    .sort((a, b) => p[b] - p[a]);

  for (const t of sortedTasks) {
    const sortedServers = Array.from({ length: cap.length }, (_, s) => s)
      .sort((s1, s2) => L[o[t]][s1] - L[o[t]][s2]);

    for (const s of sortedServers) {
      if (d[t] <= remaining[s] && calcUtility(L, o, p, t, s, lambda) > 0) {
        assign[t] = s;
        remaining[s] -= d[t];
        break;
      }
    }
  }

  const elapsedSecs = (performance.now() - t0) / 1000;
  return { assign, metrics: computeMetrics(assign, L, cap, d, p, o, elapsedSecs, lambda) };
}

// 3. Baseline: Random First-Fit
function solveRandom(L, cap, d, p, o, lambda = 1.0, seed = 0) {
  const t0 = performance.now();
  const rnd = new RandomGenerator(seed);
  const remaining = [...cap];
  const assign = new Array(d.length).fill(null);

  const taskOrder = rnd.sample(Array.from({ length: d.length }, (_, i) => i), d.length);

  for (const t of taskOrder) {
    const serverOrder = rnd.sample(Array.from({ length: cap.length }, (_, s) => s), cap.length);
    for (const s of serverOrder) {
      if (d[t] <= remaining[s] && calcUtility(L, o, p, t, s, lambda) > 0) {
        assign[t] = s;
        remaining[s] -= d[t];
        break;
      }
    }
  }

  const elapsedSecs = (performance.now() - t0) / 1000;
  return { assign, metrics: computeMetrics(assign, L, cap, d, p, o, elapsedSecs, lambda) };
}

// ==========================================
// 3. COLOR PALETTE & HEATMAP MAPPING
// ==========================================
// YlGnBu Colormap interpolation: 0.0 (pale yellow) -> 0.5 (cyan) -> 1.0 (deep navy)
function getHeatmapColor(val) {
  val = Math.max(0, Math.min(1, val));
  if (val < 0.25) {
    const t = val / 0.25;
    return `rgb(${Math.round(255 - t * 40)}, ${Math.round(255 - t * 20)}, ${Math.round(178 - t * 50)})`; // Yellowish
  } else if (val < 0.6) {
    const t = (val - 0.25) / 0.35;
    return `rgb(${Math.round(215 - t * 140)}, ${Math.round(235 - t * 70)}, ${Math.round(128 + t * 90)})`; // Green-cyan
  } else if (val < 0.85) {
    const t = (val - 0.6) / 0.25;
    return `rgb(${Math.round(75 - t * 50)}, ${Math.round(165 - t * 80)}, ${Math.round(218 + t * 10)})`; // Azure to blue
  } else {
    const t = (val - 0.85) / 0.15;
    return `rgb(${Math.round(25 - t * 15)}, ${Math.round(85 - t * 50)}, ${Math.round(228 - t * 130)})`; // Deep navy
  }
}

// ==========================================
// 4. SIMULATION STATE & CANVAS CONTROLLER
// ==========================================
const simState = {
  nServers: 40,
  nTasks: 120,
  tightness: 0.9,
  extraEdgeFactor: 1.0,
  lambda: 1.0,
  seed: 4,
  algo: 'greedy_dp',
  showAllLinks: true,
  showMST: true,
  graph: null,
  workload: null,
  latencyMatrix: null,
  mstResult: null,
  currentResult: null,
  selectedServer: null,
  hoveredServer: null,
  zoom: 1.0,
  panX: 0,
  panY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0
};

// Initialize or update the cloud simulation
function runFullSimulation() {
  const g = generateCloudTopology(simState.nServers, simState.extraEdgeFactor, simState.seed);
  const wl = generateWorkload(simState.nServers, simState.nTasks, simState.tightness, simState.seed);
  const L = dijkstraAPSP(g);
  const mst = kruskalMST(g);

  simState.graph = g;
  simState.workload = wl;
  simState.latencyMatrix = L;
  simState.mstResult = mst;

  // Run selected algorithm
  let res;
  if (simState.algo === 'greedy_dp') {
    res = solveGreedyDP(L, wl.cap, wl.demand, wl.value, wl.origin, simState.lambda);
  } else if (simState.algo === 'greedy_nearest') {
    res = solveGreedyNearest(L, wl.cap, wl.demand, wl.value, wl.origin, simState.lambda);
  } else {
    res = solveRandom(L, wl.cap, wl.demand, wl.value, wl.origin, simState.lambda, simState.seed);
  }
  simState.currentResult = res;

  updateMetricsDisplay();
  renderCanvas();
  renderRoundsTimeline();
  if (simState.selectedServer !== null) {
    openServerModal(simState.selectedServer);
  }
}

function updateMetricsDisplay() {
  if (!simState.currentResult) return;
  const m = simState.currentResult.metrics;
  const mst = simState.mstResult;
  const g = simState.graph;

  const linkSavings = g ? +((100 * (1 - (g.n - 1) / g.edges.length)).toFixed(1)) : 74.0;

  document.getElementById('metric-utility').textContent = Math.round(m.utility).toLocaleString();
  document.getElementById('metric-placed').textContent = `${m.placedPct}% (${m.placedCount}/${m.totalTasks})`;
  document.getElementById('metric-latency').textContent = `${m.avgLatency} ms`;
  document.getElementById('metric-cap-used').textContent = `${m.capUsedPct}% (${m.usedCap}/${m.totalCap})`;
  document.getElementById('metric-links').textContent = `${linkSavings}% (${mst.tree.length}/${g.edges.length})`;
  document.getElementById('metric-runtime').textContent = `${(m.secs * 1000).toFixed(2)} ms`;

  // Update summary badge
  const algoName = simState.algo === 'greedy_dp' ? 'Greedy Proposals + Knapsack DP'
                 : simState.algo === 'greedy_nearest' ? 'Greedy-Nearest (Baseline)'
                 : 'Random First-Fit (Baseline)';
  const badgeEl = document.getElementById('current-algo-badge');
  if (badgeEl) badgeEl.textContent = algoName;
}

// Canvas rendering with responsive scaling
function renderCanvas() {
  const canvas = document.getElementById('cloud-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const w = rect.width;
  const h = rect.height;

  // Background grid
  ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#1E293B' : '#F1F5F9';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  if (!simState.graph || !simState.currentResult) {
    ctx.restore();
    return;
  }

  const { pos, edges, n } = simState.graph;
  const mstEdges = new Set(simState.mstResult.tree.map(([u, v]) => `${Math.min(u, v)}-${Math.max(u, v)}`));
  const serverUsed = simState.currentResult.metrics.serverUsed;
  const cap = simState.workload.cap;

  // Transform coordinates
  function getXY(i) {
    const px = pos[i][0] * (w - 80) + 40 + simState.panX;
    const py = pos[i][1] * (h - 80) + 40 + simState.panY;
    return [px, py];
  }

  // 1. Draw All Regular Links (Grey)
  if (simState.showAllLinks) {
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? 'rgba(148, 163, 184, 0.25)' : 'rgba(213, 218, 227, 0.7)';
    for (const [u, v] of edges) {
      const key = `${Math.min(u, v)}-${Math.max(u, v)}`;
      if (simState.showMST && mstEdges.has(key)) continue; // MST drawn separately
      const [x1, y1] = getXY(u);
      const [x2, y2] = getXY(v);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // 2. Draw MST Backbone Links (Bold Orange)
  if (simState.showMST && simState.mstResult) {
    ctx.lineWidth = 3.0;
    ctx.strokeStyle = '#F28C28';
    ctx.lineCap = 'round';
    for (const [u, v] of simState.mstResult.tree) {
      const [x1, y1] = getXY(u);
      const [x2, y2] = getXY(v);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // 3. Highlight links connected to selected or hovered server
  const activeS = simState.selectedServer !== null ? simState.selectedServer : simState.hoveredServer;
  if (activeS !== null) {
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#06B6D4'; // Cyan glow
    for (const [nb, wt] of simState.graph.adj[activeS]) {
      const [x1, y1] = getXY(activeS);
      const [x2, y2] = getXY(nb);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // 4. Draw Servers (Nodes)
  for (let i = 0; i < n; i++) {
    const [x, y] = getXY(i);
    const loadRatio = cap[i] > 0 ? serverUsed[i] / cap[i] : 0;
    const baseRadius = 8 + (cap[i] / 40) * 8;
    const radius = Math.min(20, Math.max(9, baseRadius));

    // Outer glow for selected server
    if (simState.selectedServer === i) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.fill();
    } else if (simState.hoveredServer === i) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(242, 140, 40, 0.4)';
      ctx.fill();
    }

    // Node body with load heatmap color
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = getHeatmapColor(loadRatio);
    ctx.fill();
    ctx.lineWidth = simState.selectedServer === i ? 2.5 : 1.5;
    ctx.strokeStyle = '#0B2545';
    ctx.stroke();

    // Node Label
    ctx.fillStyle = loadRatio > 0.6 ? '#FFFFFF' : '#0B2545';
    ctx.font = `600 ${radius > 12 ? '11px' : '9px'} 'Inter', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`S${i}`, x, y);
  }

  ctx.restore();
}

function renderRoundsTimeline() {
  const container = document.getElementById('rounds-container');
  if (!container) return;
  container.innerHTML = '';

  if (simState.algo !== 'greedy_dp' || !simState.currentResult || !simState.currentResult.rounds) {
    container.innerHTML = `<div class="p-4 text-xs text-slate-400 italic">Step-by-step proposal rounds are applicable to the proposed <strong>Greedy + Knapsack DP</strong> pipeline. Current algorithm: <em>${simState.algo}</em>.</div>`;
    return;
  }

  const rounds = simState.currentResult.rounds;
  rounds.forEach(r => {
    const el = document.createElement('div');
    el.className = 'p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 flex items-center justify-between text-xs transition hover:border-cyan-500/40';
    el.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">R${r.round}</span>
        <span class="text-slate-300 font-medium">Proposals: <strong class="text-white">${r.proposalsCount}</strong></span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-emerald-400 font-semibold">Accepted: ${r.acceptedCount}</span>
        <span class="text-rose-400 font-semibold">Rejected: ${r.rejectedCount}</span>
      </div>
    `;
    container.appendChild(el);
  });
}

// Open modal showing detailed breakdown for selected server
function openServerModal(serverId) {
  simState.selectedServer = serverId;
  renderCanvas();

  const modal = document.getElementById('server-modal');
  if (!modal) return;

  const cap = simState.workload.cap[serverId];
  const used = simState.currentResult.metrics.serverUsed[serverId];
  const ratio = (used / cap) * 100;

  document.getElementById('modal-server-title').textContent = `Server S${serverId} Details`;
  document.getElementById('modal-server-cap').textContent = `${used} / ${cap} units (${ratio.toFixed(1)}% full)`;
  document.getElementById('modal-server-progress').style.width = `${Math.min(100, ratio)}%`;

  // Find tasks placed here
  const placedTasks = [];
  simState.currentResult.assign.forEach((s, t) => {
    if (s === serverId) {
      const orig = simState.workload.origin[t];
      const lat = simState.latencyMatrix[orig][serverId];
      const val = simState.workload.value[t];
      const dem = simState.workload.demand[t];
      const util = calcUtility(simState.latencyMatrix, simState.workload.origin, simState.workload.value, t, serverId, simState.lambda);
      placedTasks.push({ id: t, origin: orig, latency: lat, value: val, demand: dem, utility: util });
    }
  });

  const tbody = document.getElementById('modal-task-rows');
  tbody.innerHTML = '';

  if (placedTasks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-xs text-slate-400 italic">No tasks currently assigned to Server S${serverId}.</td></tr>`;
  } else {
    placedTasks.forEach(pt => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-700/40 hover:bg-slate-800/40 transition';
      tr.innerHTML = `
        <td class="py-2 px-3 font-mono font-medium text-cyan-300">#${pt.id}</td>
        <td class="py-2 px-3 text-slate-300">${pt.demand}</td>
        <td class="py-2 px-3 text-slate-300">${pt.value}</td>
        <td class="py-2 px-3 font-mono text-slate-400">S${pt.origin}</td>
        <td class="py-2 px-3 font-mono text-amber-400">${pt.latency.toFixed(2)} ms</td>
        <td class="py-2 px-3 font-semibold text-emerald-400">+${pt.utility.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  modal.classList.remove('hidden');
}

function closeServerModal() {
  const modal = document.getElementById('server-modal');
  if (modal) modal.classList.add('hidden');
  simState.selectedServer = null;
  renderCanvas();
}

// ==========================================
// 5. CHART INITIALIZATION (Experimental Results)
// ==========================================
let chartInstances = {};

function initBenchmarkCharts() {
  if (typeof Chart === 'undefined') return;

  // Chart 1: Runtime vs Network Size
  const ctx1 = document.getElementById('chart-runtime');
  if (ctx1) {
    chartInstances.runtime = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: [25, 50, 100, 150, 200],
        datasets: [
          { label: 'Kruskal', data: [0.03, 0.04, 0.09, 0.13, 0.18], borderColor: '#0B2545', backgroundColor: '#0B2545', tension: 0.2, borderWidth: 2.5 },
          { label: 'Prim', data: [0.02, 0.04, 0.08, 0.13, 0.3], borderColor: '#13A89E', backgroundColor: '#13A89E', tension: 0.2, borderWidth: 2.5 },
          { label: 'Dijkstra (All-Sources)', data: [0.29, 1.17, 5.41, 14.09, 23.91], borderColor: '#F28C28', backgroundColor: '#F28C28', tension: 0.2, borderWidth: 2.5 },
          { label: 'Floyd-Warshall', data: [0.56, 4.08, 33.27, 132.59, 303.2], borderColor: '#DC2626', backgroundColor: '#DC2626', tension: 0.2, borderWidth: 2.5 },
          { label: 'Johnson', data: [0.36, 1.38, 5.81, 12.7, 24.54], borderColor: '#8D99AE', backgroundColor: '#8D99AE', tension: 0.2, borderWidth: 2.5 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { type: 'logarithmic', title: { display: true, text: 'Runtime (ms, log scale)' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
          x: { title: { display: true, text: 'Servers (Nodes)' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
        },
        plugins: { legend: { position: 'top', labels: { boxWidth: 12 } } }
      }
    });
  }

  // Chart 2: Sparse vs Dense APSP
  const ctx2 = document.getElementById('chart-density');
  if (ctx2) {
    chartInstances.density = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: [191, 253, 452, 826, 1643, 3427],
        datasets: [
          { label: 'Floyd-Warshall O(V³)', data: [61.4, 65.8, 70.0, 73.5, 60.8, 61.2], borderColor: '#DC2626', backgroundColor: '#DC2626', tension: 0.3, borderWidth: 2.5 },
          { label: 'Johnson O(VE + V² log V)', data: [11.9, 9.4, 16.9, 18.7, 26.2, 51.6], borderColor: '#13A89E', backgroundColor: '#13A89E', tension: 0.3, borderWidth: 2.5 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { title: { display: true, text: 'Runtime (ms)' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
          x: { title: { display: true, text: 'Number of Links (V = 120)' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
        },
        plugins: { legend: { position: 'top', labels: { boxWidth: 12 } } }
      }
    });
  }

  // Chart 3: Solution Quality vs MILP Optimum
  const ctx3 = document.getElementById('chart-quality');
  if (ctx3) {
    chartInstances.quality = new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: ['Greedy + DP', 'Greedy-Nearest', 'Random'],
        datasets: [{
          label: '% of Exact Optimal Utility (MILP = 100%)',
          data: [95.2, 95.4, 61.5],
          backgroundColor: ['#13A89E', '#0B2545', '#8D99AE'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 110, title: { display: true, text: '% of Optimal Utility' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // Chart 4: Behavior Under Load - Total Utility & Average Latency
  const ctx4 = document.getElementById('chart-load-utility');
  if (ctx4) {
    chartInstances.loadUtility = new Chart(ctx4, {
      type: 'line',
      data: {
        labels: [0.4, 0.6, 0.8, 1.0, 1.2, 1.5],
        datasets: [
          { label: 'Greedy + DP', data: [8080.4, 8016.0, 7810.3, 7367.3, 6842.4, 6182.1], borderColor: '#13A89E', backgroundColor: '#13A89E', tension: 0.2, borderWidth: 2.5 },
          { label: 'Greedy-Nearest', data: [8080.4, 8003.7, 7781.2, 7384.2, 6876.8, 6179.1], borderColor: '#0B2545', backgroundColor: '#0B2545', tension: 0.2, borderWidth: 2.5 },
          { label: 'Random', data: [3484.5, 3500.2, 3489.4, 3233.3, 2886.6, 2536.8], borderColor: '#8D99AE', backgroundColor: '#8D99AE', tension: 0.2, borderWidth: 2.5 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { title: { display: true, text: 'Total Utility' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
          x: { title: { display: true, text: 'Load (Demand / Capacity)' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
        },
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
      }
    });
  }

  const ctx5 = document.getElementById('chart-load-latency');
  if (ctx5) {
    chartInstances.loadLatency = new Chart(ctx5, {
      type: 'line',
      data: {
        labels: [0.4, 0.6, 0.8, 1.0, 1.2, 1.5],
        datasets: [
          { label: 'Greedy + DP', data: [0.01, 0.25, 0.81, 1.44, 1.02, 1.07], borderColor: '#13A89E', backgroundColor: '#13A89E', tension: 0.2, borderWidth: 2.5 },
          { label: 'Greedy-Nearest', data: [0.01, 0.29, 0.98, 1.9, 2.87, 3.73], borderColor: '#0B2545', backgroundColor: '#0B2545', tension: 0.2, borderWidth: 2.5 },
          { label: 'Random', data: [18.4, 18.36, 18.46, 19.17, 19.38, 19.27], borderColor: '#8D99AE', backgroundColor: '#8D99AE', tension: 0.2, borderWidth: 2.5 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { title: { display: true, text: 'Avg Latency (ms)' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
          x: { title: { display: true, text: 'Load (Demand / Capacity)' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
        },
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
      }
    });
  }
}

// ==========================================
// 6. CODE VIEWER CONTROLLER
// ==========================================
function initCodeViewer() {
  const tabs = document.querySelectorAll('.code-tab-btn');
  const codeDisplay = document.getElementById('code-display');
  const filenameDisplay = document.getElementById('code-active-filename');

  function loadCode(filename) {
    if (typeof SOURCE_CODE !== 'undefined' && SOURCE_CODE[filename]) {
      codeDisplay.textContent = SOURCE_CODE[filename];
      filenameDisplay.textContent = filename;
      tabs.forEach(btn => {
        if (btn.dataset.file === filename) {
          btn.className = 'code-tab-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 transition';
        } else {
          btn.className = 'code-tab-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent transition';
        }
      });
    }
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', () => loadCode(btn.dataset.file));
  });

  const copyBtn = document.getElementById('copy-code-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(codeDisplay.textContent).then(() => {
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span class="text-emerald-400">Copied!</span>';
        setTimeout(() => copyBtn.innerHTML = orig, 1500);
      });
    });
  }

  loadCode('placement.py');
}

// ==========================================
// 7. POLICY ADVISOR CALCULATOR
// ==========================================
function evaluatePolicyAdvisor() {
  const vInput = parseInt(document.getElementById('policy-v')?.value || '60');
  const eInput = parseInt(document.getElementById('policy-e')?.value || '200');
  const loadInput = parseFloat(document.getElementById('policy-load')?.value || '1.1');

  const denseThreshold = (vInput * vInput) / 8;
  const isSparse = eInput < denseThreshold;
  const bestAPSP = isSparse ? 'Johnson (Reweighted Dijkstra)' : 'Floyd-Warshall (Matrix DP)';
  const apspReason = isSparse
    ? `Links (${eInput}) are well below threshold V²/8 (${Math.round(denseThreshold)}). Johnson avoids O(V³) cubic penalty, delivering up to 5x–12x speedup.`
    : `Links (${eInput}) approach dense threshold V²/8 (${Math.round(denseThreshold)}). Floyd-Warshall's flat loop overhead wins for dense meshes.`;

  const bestPlacement = loadInput >= 1.0 ? 'Greedy Proposals + Knapsack DP' : 'Greedy-Nearest or Greedy+DP';
  const placementReason = loadInput >= 1.0
    ? `At overload (Load ${loadInput} ≥ 1.0), Greedy+DP prevents server bottlenecking, slashing latency by ~3.5x (1.07 ms vs 3.73 ms) while keeping optimal utility.`
    : `At light load (${loadInput} < 1.0), server capacities are ample; both heuristics perform within 0.2% of optimal.`;

  const mstCutPct = (100 * (1 - (vInput - 1) / eInput)).toFixed(1);

  document.getElementById('advisor-apsp').textContent = bestAPSP;
  document.getElementById('advisor-apsp-desc').textContent = apspReason;
  document.getElementById('advisor-placement').textContent = bestPlacement;
  document.getElementById('advisor-placement-desc').textContent = placementReason;
  document.getElementById('advisor-backbone').textContent = `${mstCutPct}% Link Reduction`;
  document.getElementById('advisor-backbone-desc').textContent = `Using Kruskal/Prim leaves only ${vInput - 1} links out of ${eInput}. Recommended for internal replication & control heartbeat.`;
}

// ==========================================
// 8. EVENT LISTENERS & UI SETUP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Simulator Input Bindings
  const bindInput = (id, prop, isFloat = false) => {
    const el = document.getElementById(id);
    const label = document.getElementById(`${id}-val`);
    if (!el) return;
    el.addEventListener('input', (e) => {
      const val = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value);
      simState[prop] = val;
      if (label) label.textContent = e.target.value;
      runFullSimulation();
    });
  };

  bindInput('slider-servers', 'nServers');
  bindInput('slider-tasks', 'nTasks');
  bindInput('slider-tightness', 'tightness', true);
  bindInput('slider-density', 'extraEdgeFactor', true);
  bindInput('slider-lambda', 'lambda', true);

  // Algorithm Selector
  document.querySelectorAll('.algo-selector-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.algo-selector-btn').forEach(b => {
        b.className = 'algo-selector-btn px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 border border-slate-700/60 transition';
      });
      btn.className = 'algo-selector-btn px-3 py-2 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 transition';
      simState.algo = btn.dataset.algo;
      runFullSimulation();
    });
  });

  // Toggle buttons
  const toggleMST = document.getElementById('toggle-mst');
  if (toggleMST) {
    toggleMST.addEventListener('change', (e) => {
      simState.showMST = e.target.checked;
      renderCanvas();
    });
  }
  const toggleLinks = document.getElementById('toggle-links');
  if (toggleLinks) {
    toggleLinks.addEventListener('change', (e) => {
      simState.showAllLinks = e.target.checked;
      renderCanvas();
    });
  }

  // Seed randomization
  const seedBtn = document.getElementById('btn-random-seed');
  if (seedBtn) {
    seedBtn.addEventListener('click', () => {
      simState.seed = Math.floor(Math.random() * 10000);
      document.getElementById('input-seed').value = simState.seed;
      runFullSimulation();
    });
  }
  const seedInput = document.getElementById('input-seed');
  if (seedInput) {
    seedInput.addEventListener('change', (e) => {
      simState.seed = parseInt(e.target.value) || 0;
      runFullSimulation();
    });
  }

  // Modal close
  const modalCloseBtn = document.getElementById('modal-close-btn');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeServerModal);
  const modal = document.getElementById('server-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeServerModal();
    });
  }

  // Canvas Mouse Interactions (Hover and Click to select node)
  const canvas = document.getElementById('cloud-canvas');
  if (canvas) {
    function findNodeAt(clientX, clientY) {
      if (!simState.graph) return null;
      const rect = canvas.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;
      const w = rect.width, h = rect.height;

      for (let i = 0; i < simState.graph.n; i++) {
        const px = simState.graph.pos[i][0] * (w - 80) + 40 + simState.panX;
        const py = simState.graph.pos[i][1] * (h - 80) + 40 + simState.panY;
        const dx = mouseX - px;
        const dy = mouseY - py;
        if (Math.sqrt(dx * dx + dy * dy) <= 18) {
          return i;
        }
      }
      return null;
    }

    canvas.addEventListener('mousemove', (e) => {
      const node = findNodeAt(e.clientX, e.clientY);
      if (node !== simState.hoveredServer) {
        simState.hoveredServer = node;
        canvas.style.cursor = node !== null ? 'pointer' : 'default';
        renderCanvas();
      }
    });

    canvas.addEventListener('click', (e) => {
      const node = findNodeAt(e.clientX, e.clientY);
      if (node !== null) {
        openServerModal(node);
      }
    });
  }

  // Policy Advisor listeners
  ['policy-v', 'policy-e', 'policy-load'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', evaluatePolicyAdvisor);
  });

  // Responsive window resize
  window.addEventListener('resize', () => {
    renderCanvas();
  });

  // Initialize all sections
  initBenchmarkCharts();
  initCodeViewer();
  evaluatePolicyAdvisor();
  runFullSimulation();
});

// Window-level helper functions for UI
window.toggleExpView = function(expName, mode) {
  const chartEl = expName === 'load' ? document.getElementById('container-load-chart') : document.getElementById(`chart-${expName}`);
  const imgEl = document.getElementById(`img-${expName}`);
  const btnChart = document.getElementById(`btn-${expName}-chart`);
  const btnImg = document.getElementById(`btn-${expName}-img`);

  if (!chartEl || !imgEl) return;

  if (mode === 'chart') {
    chartEl.classList.remove('hidden');
    imgEl.classList.add('hidden');
    btnChart.className = 'px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-300';
    btnImg.className = 'px-2 py-0.5 text-[10px] font-medium rounded text-slate-400 hover:text-white';
  } else {
    chartEl.classList.add('hidden');
    imgEl.classList.remove('hidden');
    btnImg.className = 'px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-300';
    btnChart.className = 'px-2 py-0.5 text-[10px] font-medium rounded text-slate-400 hover:text-white';
  }
};

window.loadPresentationPreset = function() {
  document.getElementById('slider-servers').value = 40;
  document.getElementById('slider-servers-val').textContent = '40';
  document.getElementById('slider-tasks').value = 120;
  document.getElementById('slider-tasks-val').textContent = '120';
  document.getElementById('slider-tightness').value = 0.9;
  document.getElementById('slider-tightness-val').textContent = '0.9';
  document.getElementById('slider-density').value = 1.0;
  document.getElementById('slider-density-val').textContent = '1.0';
  document.getElementById('slider-lambda').value = 1.0;
  document.getElementById('slider-lambda-val').textContent = '1.0';
  document.getElementById('input-seed').value = 4;

  simState.nServers = 40;
  simState.nTasks = 120;
  simState.tightness = 0.9;
  simState.extraEdgeFactor = 1.0;
  simState.lambda = 1.0;
  simState.seed = 4;
  simState.algo = 'greedy_dp';

  document.querySelectorAll('.algo-selector-btn').forEach(btn => {
    if (btn.dataset.algo === 'greedy_dp') {
      btn.className = 'algo-selector-btn px-3 py-2 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 transition';
    } else {
      btn.className = 'algo-selector-btn px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 border border-slate-700/60 transition';
    }
  });

  runFullSimulation();
};

window.exportSimulationReport = function() {
  if (!simState.currentResult) return;
  const report = {
    project: "Cloud Task Placement (DAA Internal Project)",
    institution: "Woxsen University",
    team: [
      "Andrew Devasani (25WU0102067)",
      "Sathyanarayana Varma (25WU0102088)",
      "G. Daiwik Reddy (25WU0102340)",
      "G. Keerthan Chowdary (25WU0102076)"
    ],
    timestamp: new Date().toISOString(),
    configuration: {
      servers: simState.nServers,
      tasks: simState.nTasks,
      tightness: simState.tightness,
      density: simState.extraEdgeFactor,
      lambda: simState.lambda,
      seed: simState.seed,
      algorithm: simState.algo
    },
    metrics: simState.currentResult.metrics,
    mstBackbone: {
      edgesCount: simState.mstResult.tree.length,
      totalWeight: simState.mstResult.totalWeight
    },
    placements: simState.currentResult.assign.map((s, t) => ({
      taskId: t,
      assignedServer: s,
      demand: simState.workload.demand[t],
      value: simState.workload.value[t],
      userOrigin: simState.workload.origin[t]
    }))
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cloud_placement_report_V${simState.nServers}_T${simState.nTasks}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
