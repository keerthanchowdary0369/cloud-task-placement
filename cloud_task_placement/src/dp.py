"""Dynamic programming: 0-1 knapsack with item recovery."""


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
    return dp[n][capacity], chosen[::-1]
