"""Cloud task placement: pipeline + baselines + exact solver (small instances).

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
    return assign, _metrics(assign, L, cap, d, p, o, time.perf_counter() - t0)
