# Cloud Task Placement (DAA Internal Project)

🌐 **Live Website:** [cloud placement](https://keerthanchowdary0369.github.io/cloud-task-placement/)

Place tasks (VMs) on servers so that valuable tasks get low latency without overloading any server.
Servers are graph nodes, link latencies are edge weights.

## Problem
- Servers `s` with capacity, tasks `t` with demand, value and user-origin node.
- Utility of placing `t` on `s` = `value(t) - LAMBDA * latency(origin(t), s)`.
- Maximise total utility, each task on at most one server, capacities respected.
- This is a Generalised Assignment Problem (NP-hard), so the main solver is a heuristic that is measured against an exact MILP on small cases.

## Algorithms (where they live)
| Subproblem | Algorithm | File |
|---|---|---|
| Backbone | Kruskal (union-find), Prim (binary heap) | `src/mst.py` |
| Latency, one source | Dijkstra | `src/shortest.py` |
| Negative edges | Bellman-Ford | `src/shortest.py` |
| All pairs | Floyd-Warshall (dense), Johnson (sparse) | `src/shortest.py` |
| Upper bound / scheduling | Fractional knapsack, job sequencing | `src/greedy.py` |
| Per-server selection | 0-1 knapsack DP | `src/dp.py` |
| Placement | Greedy proposals + knapsack DP, baselines, exact MILP | `src/placement.py` |

## Run
```bash
pip install numpy scipy matplotlib
python tests/test_all.py          # 7 correctness tests
python run_experiments.py         # writes charts + results.json into results/
```

## Results (synthetic data, seeded)
- Johnson is about 12x faster than Floyd-Warshall at 200 servers on a sparse topology.
- Greedy+DP reaches about 95% of the exact optimum on small instances (nearest-first is the same, random is about 61%).
- Under overload (load 1.5) Greedy+DP has about 3.5x lower average latency than nearest-first at the same utility.
- MST backbone removes about 74% of links and 82-84% of link cost, with a 1.8-2.7x latency stretch.

Timings come from single runs on one machine, so small differences are noise.
