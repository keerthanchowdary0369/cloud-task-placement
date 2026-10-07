"""Shortest paths: Dijkstra, Bellman-Ford, Floyd-Warshall, Johnson."""
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
    return [(u, v, w) for u, v, w in edges] + [(v, u, w) for u, v, w in edges]
