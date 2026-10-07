"""Minimum spanning tree: Kruskal (union-find) and Prim (binary heap)."""
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
    return total, tree
