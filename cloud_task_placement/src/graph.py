"""Graph model (adjacency list) + synthetic cloud-topology generator."""
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
    `tightness` = total demand / total capacity (>1 means overloaded cloud)."""
    rnd = random.Random(seed + 1000)
    demand = [rnd.randint(1, 10) for _ in range(n_tasks)]
    value = [rnd.randint(5, 60) for _ in range(n_tasks)]
    origin = [rnd.randrange(n_servers) for _ in range(n_tasks)]
    total_cap = max(n_servers * 5, int(sum(demand) / tightness))
    base = total_cap // n_servers
    cap = [max(5, int(base * rnd.uniform(0.6, 1.4))) for _ in range(n_servers)]
    return cap, demand, value, origin
