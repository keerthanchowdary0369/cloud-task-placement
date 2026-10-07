"""Runs every experiment and writes CSVs + charts to results/.   python run_experiments.py"""
import json
import statistics as st
import time

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from src.graph import make_cloud_topology, make_workload
from src.mst import kruskal, prim
from src.shortest import dijkstra, floyd_warshall, johnson, undirected_to_directed
from src.placement import (apsp, backbone_latency, solve_exact, solve_greedy_dp,
                           solve_greedy_nearest, solve_random)

NAVY, TEAL, ORANGE, GREY = "#0B2545", "#13A89E", "#F28C28", "#8D99AE"
plt.rcParams.update({"font.size": 11, "axes.spines.top": False, "axes.spines.right": False})
out = {}


def timeit(fn, reps=1):
    t = time.perf_counter()
    for _ in range(reps):
        fn()
    return (time.perf_counter() - t) / reps * 1000  # ms


# 1. Algorithm runtime vs graph size -------------------------------------------------
sizes = [25, 50, 100, 150, 200]
rt = {k: [] for k in ["Kruskal", "Prim", "Dijkstra (all sources)", "Floyd-Warshall", "Johnson"]}
for n in sizes:
    g, _ = make_cloud_topology(n, 1.0, 1)
    de = undirected_to_directed(g.edges)
    rt["Kruskal"].append(timeit(lambda: kruskal(g), 3))
    rt["Prim"].append(timeit(lambda: prim(g), 3))
    rt["Dijkstra (all sources)"].append(timeit(lambda: [dijkstra(g.adj, s) for s in range(n)]))
    rt["Floyd-Warshall"].append(timeit(lambda: floyd_warshall(n, g.edges)))
    rt["Johnson"].append(timeit(lambda: johnson(n, de)))
out["runtime_ms"] = {"sizes": sizes, **{k: [round(x, 2) for x in v] for k, v in rt.items()}}
fig, ax = plt.subplots(figsize=(7, 4.2))
for (k, v), c in zip(rt.items(), [NAVY, TEAL, ORANGE, "#C0392B", GREY]):
    ax.plot(sizes, v, marker="o", label=k, color=c, lw=2)
ax.set_yscale("log"); ax.set_xlabel("Servers (nodes)"); ax.set_ylabel("Runtime (ms, log scale)")
ax.set_title("Runtime vs network size"); ax.legend(frameon=False, fontsize=9)
fig.tight_layout(); fig.savefig("results/runtime_vs_size.png", dpi=170); plt.close(fig)

# 2. Density: Floyd-Warshall vs Johnson ---------------------------------------------
n, dens = 120, [0.5, 1, 2, 4, 8, 16]
fw_t, jo_t, edges = [], [], []
for f in dens:
    g, _ = make_cloud_topology(n, f, 2)
    edges.append(len(g.edges))
    fw_t.append(timeit(lambda: floyd_warshall(n, g.edges)))
    jo_t.append(timeit(lambda: johnson(n, undirected_to_directed(g.edges))))
out["density"] = {"edges": edges, "floyd_ms": [round(x, 1) for x in fw_t], "johnson_ms": [round(x, 1) for x in jo_t]}
fig, ax = plt.subplots(figsize=(7, 4.2))
ax.plot(edges, fw_t, marker="o", color="#C0392B", lw=2, label="Floyd-Warshall  O(V^3)")
ax.plot(edges, jo_t, marker="o", color=TEAL, lw=2, label="Johnson  O(VE + V^2 log V)")
ax.set_xlabel(f"Number of links (V = {n})"); ax.set_ylabel("Runtime (ms)")
ax.set_title("APSP: sparse vs dense network"); ax.legend(frameon=False)
fig.tight_layout(); fig.savefig("results/apsp_density.png", dpi=170); plt.close(fig)

# 3. Solution quality vs exact optimum (small instances) ---------------------------
ratios = {"Greedy+DP": [], "Greedy-nearest": [], "Random": []}
for seed in range(12):
    g, _ = make_cloud_topology(10, 1.0, seed)
    cap, d, p, o = make_workload(10, 16, 0.9, seed)
    L = apsp(g)
    _, ex = solve_exact(L, cap, d, p, o)
    for name, fn in [("Greedy+DP", solve_greedy_dp), ("Greedy-nearest", solve_greedy_nearest),
                     ("Random", solve_random)]:
        _, m = fn(L, cap, d, p, o)
        ratios[name].append(100 * m["utility"] / ex["utility"])
out["optimality_pct"] = {k: {"mean": round(st.mean(v), 1), "min": round(min(v), 1)} for k, v in ratios.items()}
fig, ax = plt.subplots(figsize=(6.4, 4.2))
names = list(ratios)
means = [st.mean(ratios[k]) for k in names]
bars = ax.bar(names, means, color=[TEAL, NAVY, GREY])
for b, m in zip(bars, means):
    ax.text(b.get_x() + b.get_width() / 2, m + 1, f"{m:.1f}%", ha="center", fontweight="bold")
ax.set_ylim(0, 112); ax.set_ylabel("% of optimal utility (MILP = 100)")
ax.set_title("Quality vs exact optimum (12 small instances)")
fig.tight_layout(); fig.savefig("results/quality_vs_optimal.png", dpi=170); plt.close(fig)

# 4. Capacity tightness sweep (60 servers, 250 tasks) -----------------------------
tight = [0.4, 0.6, 0.8, 1.0, 1.2, 1.5]
sweep = {k: {"utility": [], "placed": [], "latency": []} for k in ["Greedy+DP", "Greedy-nearest", "Random"]}
g, _ = make_cloud_topology(60, 1.0, 7)
L = apsp(g)
for tg in tight:
    ms = {k: [] for k in sweep}
    for seed in range(4):
        cap, d, p, o = make_workload(60, 250, tg, seed)
        for name, fn in [("Greedy+DP", solve_greedy_dp), ("Greedy-nearest", solve_greedy_nearest),
                         ("Random", solve_random)]:
            ms[name].append(fn(L, cap, d, p, o)[1])
    for k in sweep:
        sweep[k]["utility"].append(round(st.mean(m["utility"] for m in ms[k]), 1))
        sweep[k]["placed"].append(round(st.mean(m["placed_pct"] for m in ms[k]), 1))
        sweep[k]["latency"].append(round(st.mean(m["avg_latency"] for m in ms[k]), 2))
out["tightness"] = {"levels": tight, **sweep}
fig, axs = plt.subplots(1, 2, figsize=(10.5, 4))
for (k, v), c in zip(sweep.items(), [TEAL, NAVY, GREY]):
    axs[0].plot(tight, v["utility"], marker="o", color=c, lw=2, label=k)
    axs[1].plot(tight, v["latency"], marker="o", color=c, lw=2, label=k)
axs[0].set_title("Total utility"); axs[1].set_title("Average latency of placed tasks (ms)")
for a in axs:
    a.set_xlabel("Load = demand / capacity")
axs[0].legend(frameon=False)
fig.tight_layout(); fig.savefig("results/tightness_sweep.png", dpi=170); plt.close(fig)

# 5. Scalability of the placement algorithm ---------------------------------------
scal = []
for n_s, n_t in [(20, 100), (40, 200), (60, 400), (80, 600)]:
    g, _ = make_cloud_topology(n_s, 1.0, 3)
    cap, d, p, o = make_workload(n_s, n_t, 0.9, 3)
    L = apsp(g)
    scal.append({"servers": n_s, "tasks": n_t, "secs": solve_greedy_dp(L, cap, d, p, o)[1]["secs"]})
out["scalability"] = scal

# 6. MST backbone vs full network ---------------------------------------------------
bb = []
for n_s in [30, 60, 100]:
    g, _ = make_cloud_topology(n_s, 2.0, 11)
    L = apsp(g)
    w, Lb = backbone_latency(g)
    pairs = [(a, b) for a in range(n_s) for b in range(a + 1, n_s)]
    stretch = st.mean(Lb[a][b] / L[a][b] for a, b in pairs)
    bb.append({"servers": n_s, "links_full": len(g.edges), "links_mst": n_s - 1,
               "cost_full": round(g.total_weight(), 1), "cost_mst": round(w, 1),
               "link_saving_pct": round(100 * (1 - (n_s - 1) / len(g.edges)), 1),
               "latency_stretch": round(stretch, 2)})
out["backbone"] = bb

# 7. Topology picture with MST + placement -----------------------------------------
g, pos = make_cloud_topology(40, 1.0, 4)
cap, d, p, o = make_workload(40, 120, 0.9, 4)
L = apsp(g)
assign, m = solve_greedy_dp(L, cap, d, p, o)
_, tree = kruskal(g)
load = [0] * 40
for t, s in enumerate(assign):
    if s is not None:
        load[s] += d[t]
fig, ax = plt.subplots(figsize=(6.6, 5.6))
for u, v, _ in g.edges:
    ax.plot(*zip(pos[u], pos[v]), color="#D5DAE3", lw=0.8, zorder=1)
for u, v, _ in tree:
    ax.plot(*zip(pos[u], pos[v]), color=ORANGE, lw=2.2, zorder=2)
sc = ax.scatter([x for x, _ in pos], [y for _, y in pos], s=[40 + 280 * load[i] / max(cap[i], 1) for i in range(40)],
                c=[load[i] / cap[i] for i in range(40)], cmap="YlGnBu", edgecolors=NAVY, zorder=3, vmin=0, vmax=1)
plt.colorbar(sc, label="Server load (used / capacity)", shrink=0.8)
ax.axis("off")
fig.suptitle("40-server cloud: MST backbone (orange) + load", fontsize=12)
fig.tight_layout(); fig.savefig("results/topology_placement.png", dpi=170); plt.close(fig)
out["demo"] = m

json.dump(out, open("results/results.json", "w"), indent=2)
print(json.dumps(out, indent=1)[:3500])
