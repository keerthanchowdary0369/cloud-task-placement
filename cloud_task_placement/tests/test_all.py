"""Correctness tests: run with  python -m pytest -q   (or python tests/test_all.py)"""
import itertools
import random
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.graph import make_cloud_topology, make_workload
from src.mst import kruskal, prim
from src.shortest import (bellman_ford, dijkstra, floyd_warshall, johnson,
                          undirected_to_directed, INF)
from src.dp import knapsack_01
from src.greedy import fractional_knapsack, job_sequencing
from src.placement import apsp, solve_greedy_dp, solve_greedy_nearest, solve_exact


def test_mst_kruskal_equals_prim():
    for seed in range(5):
        g, _ = make_cloud_topology(40, 1.0, seed)
        assert abs(kruskal(g)[0] - prim(g)[0]) < 1e-6
        assert len(kruskal(g)[1]) == g.n - 1


def test_shortest_paths_agree():
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


def test_johnson_negative_edges():
    edges = [(0, 1, 4), (1, 2, -2), (0, 2, 5), (2, 3, 1)]
    out = johnson(4, edges)
    assert out[0][3] == 3 and out[0][2] == 2


def test_bellman_ford_detects_negative_cycle():
    _, neg = bellman_ford(3, [(0, 1, 1), (1, 2, -3), (2, 0, 1)], 0)
    assert neg


def test_knapsack_matches_bruteforce():
    rnd = random.Random(1)
    for _ in range(30):
        n = 8
        v = [rnd.randint(1, 30) for _ in range(n)]
        w = [rnd.randint(1, 9) for _ in range(n)]
        cap = rnd.randint(5, 25)
        best = max(sum(v[i] for i in c) for r in range(n + 1)
                   for c in itertools.combinations(range(n), r)
                   if sum(w[i] for i in c) <= cap)
        val, chosen = knapsack_01(v, w, cap)
        assert val == best and sum(w[i] for i in chosen) <= cap
        assert fractional_knapsack(v, w, cap) >= best - 1e-9   # upper bound


def test_job_sequencing():
    sched, profit = job_sequencing([("a", 2, 100), ("b", 1, 19), ("c", 2, 27),
                                    ("d", 1, 25), ("e", 3, 15)])
    assert profit == 142


def test_placement_feasible_and_near_optimal():
    g, _ = make_cloud_topology(8, 1.0, 5)
    cap, d, p, o = make_workload(8, 12, 0.9, 5)
    L = apsp(g)
    _, ex = solve_exact(L, cap, d, p, o)
    _, gd = solve_greedy_dp(L, cap, d, p, o)
    _, gn = solve_greedy_nearest(L, cap, d, p, o)
    assert gd["utility"] <= ex["utility"] + 1e-6
    assert gd["utility"] >= 0.85 * ex["utility"]


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("PASS", name)
