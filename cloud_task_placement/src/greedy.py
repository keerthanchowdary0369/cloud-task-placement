"""Greedy components: fractional knapsack bound and job sequencing with deadlines."""


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
    return slot[1:], total
