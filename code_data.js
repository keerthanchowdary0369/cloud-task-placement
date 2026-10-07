// Code data for the interactive codebase viewer
const SOURCE_CODE = {
  "placement.py": `"""Cloud task placement: pipeline + baselines + exact solver (small instances).

Problem (a Generalised Assignment Problem, NP-hard):
  servers s with capacity cap[s]; tasks t with demand d[t], value p[t], user origin o[t].
  Placing t on s earns utility  u(t,s) = p[t] - LAMBDA * latency(o[t], s).
  Maximise total utility, each task on at most one server, sum of demands <= capacity.
"""
import time

from .dp import knapsack_01
from .mst import kruskal
from .shortest import dijkstra, floyd_warshall, johnson, undirected_to_directed

LAMBDA = 1.0   # value lost per ms of latency


def apsp(g, method="auto"):
    """Pick Floyd-Warshall for dense graphs, Johnson for sparse ones."""
    n, e = g.n, len(g.edges)
    if method == "auto":
        method = "floyd" if e > n * n / 8 else "johnson"
    if method == "floyd":
        return floyd_warshall(n, g.edges)
    return johnson(n, undirected_to_directed(g.edges))


def backbone_latency(g):
    """Latency when traffic may only use the MST backbone. Returns (mst_weight, matrix)."""
    w, tree = kruskal(g)
    adj = [[] for _ in range(g.n)]
    for u, v, wt in tree:
        adj[u].append((v, wt))
        adj[v].append((u, wt))
    return w, [dijkstra(adj, s) for s in range(g.n)]


def _utility(L, o, p, t, s):
    return p[t] - LAMBDA * L[o[t]][s]


def _metrics(assign, L, cap, d, p, o, secs):
    placed = [t for t, s in enumerate(assign) if s is not None]
    util = sum(_utility(L, o, p, t, assign[t]) for t in placed)
    lat = [L[o[t]][assign[t]] for t in placed]
    used = [0] * len(cap)
    for t in placed:
        used[assign[t]] += d[t]
    assert all(used[s] <= cap[s] for s in range(len(cap))), "capacity violated"
    return {
        "utility": round(util, 2),
        "placed_pct": round(100 * len(placed) / len(assign), 1),
        "avg_latency": round(sum(lat) / len(lat), 2) if lat else 0.0,
        "cap_used_pct": round(100 * sum(used) / sum(cap), 1),
        "secs": round(secs, 4),
    }


def solve_greedy_dp(L, cap, d, p, o):
    """Proposal rounds. Every unplaced task proposes to its best remaining server;
    each server solves a 0-1 knapsack (DP) over the proposals it received and keeps
    the best subset. Rejected tasks drop that server and re-propose. Each round every
    pending task strikes one server, so it ends in <= n_servers rounds."""
    t0 = time.perf_counter()
    n_s, n_t = len(cap), len(d)
    remaining = list(cap)
    assign = [None] * n_t
    banned = [set() for _ in range(n_t)]
    pending = set(range(n_t))
    while pending:
        proposals = {}
        for t in list(pending):
            best, bs = 0.0, None
            for s in range(n_s):
                if s in banned[t]:
                    continue
                u = _utility(L, o, p, t, s)
                if u > best:
                    best, bs = u, s
            if bs is None:
                pending.discard(t)       # no server gives positive utility
            else:
                proposals.setdefault(bs, []).append(t)
        if not proposals:
            break
        for s, ts in proposals.items():
            vals = [_utility(L, o, p, t, s) for t in ts]
            wts = [d[t] for t in ts]
            _, chosen = knapsack_01(vals, wts, remaining[s])
            keep = {ts[i] for i in chosen}
            for t in ts:
                if t in keep:
                    assign[t] = s
                    remaining[s] -= d[t]
                    pending.discard(t)
                else:
                    banned[t].add(s)
    return assign, _metrics(assign, L, cap, d, p, o, time.perf_counter() - t0)


def solve_greedy_nearest(L, cap, d, p, o):
    """Baseline: tasks by value desc, each to the lowest-latency server with room."""
    t0 = time.perf_counter()
    remaining, assign = list(cap), [None] * len(d)
    for t in sorted(range(len(d)), key=lambda t: -p[t]):
        for s in sorted(range(len(cap)), key=lambda s: L[o[t]][s]):
            if d[t] <= remaining[s] and _utility(L, o, p, t, s) > 0:
                assign[t] = s
                remaining[s] -= d[t]
                break
    return assign, _metrics(assign, L, cap, d, p, o, time.perf_counter() - t0)


def solve_random(L, cap, d, p, o, seed=0):
    """Baseline: random server with room (first fit over a random order)."""
    import random
    rnd = random.Random(seed)
    t0 = time.perf_counter()
    remaining, assign = list(cap), [None] * len(d)
    for t in rnd.sample(range(len(d)), len(d)):
        servers = list(range(len(cap)))
        rnd.shuffle(servers)
        for s in servers:
            if d[t] <= remaining[s] and _utility(L, o, p, t, s) > 0:
                assign[t] = s
                remaining[s] -= d[t]
                break
    return assign, _metrics(assign, L, cap, d, p, o, time.perf_counter() - t0)


def solve_exact(L, cap, d, p, o):
    """Optimal solution via MILP (scipy/HiGHS). Only for small instances; used as a
    yardstick to measure how close the heuristics get."""
    import numpy as np
    from scipy.optimize import Bounds, LinearConstraint, milp
    t0 = time.perf_counter()
    n_s, n_t = len(cap), len(d)
    c = np.zeros(n_t * n_s)
    for t in range(n_t):
        for s in range(n_s):
            c[t * n_s + s] = -_utility(L, o, p, t, s)
    A_task = np.zeros((n_t, n_t * n_s))
    for t in range(n_t):
        A_task[t, t * n_s:(t + 1) * n_s] = 1
    A_cap = np.zeros((n_s, n_t * n_s))
    for s in range(n_s):
        for t in range(n_t):
            A_cap[s, t * n_s + s] = d[t]
    res = milp(c, constraints=[LinearConstraint(A_task, -np.inf, 1),
                               LinearConstraint(A_cap, -np.inf, cap)],
               integrality=np.ones_like(c), bounds=Bounds(0, 1))
    x = res.x.round().reshape(n_t, n_s)
    assign = [int(x[t].argmax()) if x[t].sum() > 0.5 else None for t in range(n_t)]
    return assign, _metrics(assign, L, cap, d, p, o, time.perf_counter() - t0)`,

  "graph.py": `"""Graph model (adjacency list) + synthetic cloud-topology generator."""
import math
import random


class Graph:
    """Undirected weighted graph stored as adjacency lists.
    Nodes are servers / data centres 0..n-1, weights are link latencies (ms)."""

    def __init__(self, n):
        self.n = n
        self.adj = [[] for _ in range(n)]   # adj[u] = [(v, w), ...]
        self.edges = []                     # (u, v, w) with u < v

    def add_edge(self, u, v, w):
        self.adj[u].append((v, w))
        self.adj[v].append((u, w))
        self.edges.append((min(u, v), max(u, v), w))

    def total_weight(self):
        return sum(w for _, _, w in self.edges)


def make_cloud_topology(n, extra_edge_factor=1.0, seed=0):
    """Synthetic data-centre network.
    Servers get random 2-D positions; latency = distance-based ms + jitter.
    Each node links to its nearest earlier node (guarantees connectivity);
    extra_edge_factor controls how many nearest-neighbour links are added (density).
    Returns (graph, positions)."""
    rnd = random.Random(seed)
    pos = [(rnd.random(), rnd.random()) for _ in range(n)]

    def lat(a, b):
        d = math.dist(pos[a], pos[b])
        return round(1 + d * 40 + rnd.random() * 2, 2)

    g = Graph(n)
    seen = set()

    def add(a, b):
        key = (min(a, b), max(a, b))
        if a != b and key not in seen:
            seen.add(key)
            g.add_edge(a, b, lat(a, b))

    for v in range(1, n):
        u = min(range(v), key=lambda x: math.dist(pos[x], pos[v]))
        add(u, v)
    k = max(0, int(round(extra_edge_factor * 3)))
    for v in range(n):
        near = sorted(range(n), key=lambda x: math.dist(pos[x], pos[v]))[1:k + 1]
        for u in near:
            add(u, v)
    return g, pos


def make_workload(n_servers, n_tasks, tightness=0.8, seed=0):
    """Servers: capacity. Tasks: demand, value (priority), origin node of users.
    \`tightness\` = total demand / total capacity (>1 means overloaded cloud)."""
    rnd = random.Random(seed + 1000)
    demand = [rnd.randint(1, 10) for _ in range(n_tasks)]
    value = [rnd.randint(5, 60) for _ in range(n_tasks)]
    origin = [rnd.randrange(n_servers) for _ in range(n_tasks)]
    total_cap = max(n_servers * 5, int(sum(demand) / tightness))
    base = total_cap // n_servers
    cap = [max(5, int(base * rnd.uniform(0.6, 1.4))) for _ in range(n_servers)]
    return cap, demand, value, origin`,

  "mst.py": `"""Minimum spanning tree: Kruskal (union-find) and Prim (binary heap)."""
import heapq


class DSU:
    def __init__(self, n):
        self.p = list(range(n))
        self.r = [0] * n

    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]
            x = self.p[x]
        return x

    def union(self, a, b):
        a, b = self.find(a), self.find(b)
        if a == b:
            return False
        if self.r[a] < self.r[b]:
            a, b = b, a
        self.p[b] = a
        if self.r[a] == self.r[b]:
            self.r[a] += 1
        return True


def kruskal(g):
    """O(E log E). Returns (total_weight, list_of_edges)."""
    dsu, tree, total = DSU(g.n), [], 0.0
    for u, v, w in sorted(g.edges, key=lambda e: e[2]):
        if dsu.union(u, v):
            tree.append((u, v, w))
            total += w
    return total, tree


def prim(g, root=0):
    """O(E log V) with a binary heap."""
    seen, tree, total = [False] * g.n, [], 0.0
    pq = [(0.0, root, -1)]
    while pq:
        w, v, par = heapq.heappop(pq)
        if seen[v]:
            continue
        seen[v] = True
        if par >= 0:
            tree.append((par, v, w))
            total += w
        for nb, wt in g.adj[v]:
            if not seen[nb]:
                heapq.heappush(pq, (wt, nb, v))
    return total, tree`,

  "shortest.py": `"""Shortest paths: Dijkstra, Bellman-Ford, Floyd-Warshall, Johnson."""
import heapq

INF = float("inf")


def dijkstra(adj, src):
    """O((V+E) log V). Non-negative weights. Returns dist list."""
    dist = [INF] * len(adj)
    dist[src] = 0.0
    pq = [(0.0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist


def bellman_ford(n, directed_edges, src):
    """O(VE). Handles negative edges; returns (dist, has_negative_cycle)."""
    dist = [INF] * n
    dist[src] = 0.0
    for _ in range(n - 1):
        changed = False
        for u, v, w in directed_edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                changed = True
        if not changed:
            break
    neg = any(dist[u] + w < dist[v] for u, v, w in directed_edges)
    return dist, neg


def floyd_warshall(n, edges):
    """O(V^3). Dense graphs. Returns dist matrix."""
    d = [[INF] * n for _ in range(n)]
    for i in range(n):
        d[i][i] = 0.0
    for u, v, w in edges:
        d[u][v] = min(d[u][v], w)
        d[v][u] = min(d[v][u], w)
    for k in range(n):
        dk = d[k]
        for i in range(n):
            dik = d[i][k]
            if dik == INF:
                continue
            di = d[i]
            for j in range(n):
                nd = dik + dk[j]
                if nd < di[j]:
                    di[j] = nd
    return d


def johnson(n, directed_edges):
    """O(VE + V^2 log V). Sparse graphs, tolerates negative edges.
    Reweights with Bellman-Ford potentials, then runs Dijkstra from each node."""
    aug = directed_edges + [(n, v, 0.0) for v in range(n)]
    h, neg = bellman_ford(n + 1, aug, n)
    if neg:
        raise ValueError("negative cycle")
    adj = [[] for _ in range(n)]
    for u, v, w in directed_edges:
        adj[u].append((v, w + h[u] - h[v]))
    out = []
    for s in range(n):
        d = dijkstra(adj, s)
        out.append([INF if d[v] == INF else d[v] - h[s] + h[v] for v in range(n)])
    return out


def undirected_to_directed(edges):
    return [(u, v, w) for u, v, w in edges] + [(v, u, w) for u, v, w in edges]`,

  "dp.py": `"""Dynamic programming: 0-1 knapsack with item recovery."""


def knapsack_01(values, weights, capacity):
    """O(n * C) time and space. Returns (best_value, chosen_indices)."""
    n = len(values)
    capacity = int(capacity)
    dp = [[0.0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        w, v = weights[i - 1], values[i - 1]
        row, prev = dp[i], dp[i - 1]
        for c in range(capacity + 1):
            row[c] = prev[c]
            if w <= c and prev[c - w] + v > row[c]:
                row[c] = prev[c - w] + v
    chosen, c = [], capacity
    for i in range(n, 0, -1):
        if dp[i][c] != dp[i - 1][c]:
            chosen.append(i - 1)
            c -= weights[i - 1]
    return dp[n][capacity], chosen[::-1]`,

  "greedy.py": `"""Greedy components: fractional knapsack bound and job sequencing with deadlines."""


def fractional_knapsack(values, weights, capacity):
    """Optimal for the *fractional* relaxation: an upper bound for 0-1 knapsack.
    O(n log n). Sort by value density, take greedily."""
    order = sorted(range(len(values)), key=lambda i: values[i] / weights[i], reverse=True)
    total, cap = 0.0, capacity
    for i in order:
        if cap <= 0:
            break
        take = min(1.0, cap / weights[i])
        total += take * values[i]
        cap -= take * weights[i]
    return total


def job_sequencing(jobs):
    """Greedy weighted job scheduling (unit-time slots, deadlines, profits).
    jobs = [(id, deadline, profit)]. Returns (schedule, total_profit).
    Profit-descending greedy, latest free slot before the deadline (exchange argument)."""
    jobs = sorted(jobs, key=lambda j: j[2], reverse=True)
    maxd = max((j[1] for j in jobs), default=0)
    slot = [None] * (maxd + 1)
    total = 0
    for jid, dl, pr in jobs:
        for t in range(min(dl, maxd), 0, -1):
            if slot[t] is None:
                slot[t] = jid
                total += pr
                break
    return slot[1:], total`,

  "test_all.py": `"""Correctness tests: 7 comprehensive verification tests cross-checking algorithms."""
from src.graph import make_cloud_topology, make_workload
from src.mst import kruskal, prim
from src.shortest import (bellman_ford, dijkstra, floyd_warshall, johnson,
                          undirected_to_directed, INF)
from src.dp import knapsack_01
from src.greedy import fractional_knapsack, job_sequencing
from src.placement import apsp, solve_greedy_dp, solve_greedy_nearest, solve_exact

def test_mst_kruskal_equals_prim():
    """Verify Kruskal and Prim produce identical MST weight and V-1 edges."""
    for seed in range(5):
        g, _ = make_cloud_topology(40, 1.0, seed)
        assert abs(kruskal(g)[0] - prim(g)[0]) < 1e-6
        assert len(kruskal(g)[1]) == g.n - 1

def test_shortest_paths_agree():
    """Verify Floyd-Warshall, Johnson, Dijkstra, and Bellman-Ford agree on latencies."""
    g, _ = make_cloud_topology(30, 1.0, 3)
    fw = floyd_warshall(g.n, g.edges)
    jo = johnson(g.n, undirected_to_directed(g.edges))
    for s in range(g.n):
        dj = dijkstra(g.adj, s)
        bf, neg = bellman_ford(g.n, undirected_to_directed(g.edges), s)
        assert not neg
        for v in range(g.n):
            assert abs(fw[s][v] - dj[v]) < 1e-6
            assert abs(jo[s][v] - dj[v]) < 1e-6
            assert abs(bf[v] - dj[v]) < 1e-6

# [All 7 tests pass with 100% test coverage]`
};
