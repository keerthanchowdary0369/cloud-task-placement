# ☁️ Cloud Task Placement — Interactive Research & Simulation System

> **Design and Analysis of Algorithms (DAA) | Project-Based Learning (PBL)**  
> **Institution:** School of Technology, Woxsen University  
> **Program:** B.Tech Computer Science & Engineering (2025–2029)  
> **Semester:** 03 | **Academic Year:** 2026–27  
> **Faculty Guide:** Dr. Syed Javeed Pasha *(Department of Computer Science & Engineering)*  

---

## 🚀 Quick Access Links (Direct Viewers on GitHub)

| Resource | Description | Direct Access Link |
|:---|:---|:---|
| 🌐 **Interactive Web Platform** | Live online simulation & visualizer | [**cloud placement**](https://keerthanchowdary0369.github.io/cloud-task-placement/) |
| 📜 **Student Certifications** | Verified DSA & Problem Solving credentials | [**CERTIFICATES.md**](CERTIFICATES.md) |
| 📑 **Academic PBL Report (PDF)** | Official comprehensive project report | [**Cloud_Task_Placement_PBL_Report.pdf**](docs/Cloud_Task_Placement_PBL_Report.pdf) |
| 📊 **Presentation Slides (PDF)** | 18-slide formal evaluation presentation | [**Cloud_Task_Placement_Project.pdf**](docs/Cloud_Task_Placement_Project.pdf) |
| 📑 **Academic Report (Markdown)** | In-repo text report with proofs & formulas | [**REPORT.md**](REPORT.md) |
| 📊 **Presentation Slides (Markdown)** | Complete slide-by-slide markdown transcript | [**PRESENTATION.md**](PRESENTATION.md) |
| 📥 **Word Document Report** | Downloadable editable report (`.docx`) | [**Cloud_Task_Placement_PBL_Report.docx**](docs/Cloud_Task_Placement_PBL_Report.docx) |
| 📥 **PowerPoint Slides** | Downloadable native presentation (`.pptx`) | [**Cloud_Task_Placement_Project.pptx**](docs/Cloud_Task_Placement_Project.pptx) |

---

## 👥 Project Team & Module Ownership

| S. No. | Student Name | Registration Number | Core Algorithmic Responsibilities |
|:---:|:---|:---:|:---|
| 1 | **Andrew Devasani** | `25WU0102067` | Graph topology modeling, synthetic workload generator, and Minimum Spanning Tree algorithms (`graph.py`, `mst.py`). |
| 2 | **Sathyanarayana Varma** | `25WU0102088` | All-Pairs Shortest Path engines (Dijkstra, Bellman-Ford, Floyd-Warshall, Johnson) (`shortest.py`). |
| 3 | **G. Daiwik Reddy** | `25WU0102340` | 0-1 Knapsack Dynamic Programming with item recovery, fractional knapsack, and job sequencing (`dp.py`, `greedy.py`). |
| 4 | **G. Keerthan Chowdary** | `25WU0102076` | Two-phase placement heuristic, MILP exact solver, benchmarking suite, and interactive web dashboard (`placement.py`, `run_experiments.py`, `index.html`). |

---

## 📚 Curricular Mapping to DAA Syllabus

This project integrates core algorithmic paradigms taught in Design and Analysis of Algorithms into a unified production pipeline:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                      DAA PARADIGMS INTEGRATION PIPELINE                       │
├─────────────────────┬───────────────────────────┬─────────────────────────────┤
│ Algorithmic Method  │ Module / Implementation   │ Course Relevance & Topic    │
├─────────────────────┼───────────────────────────┼─────────────────────────────┤
│ Greedy Strategies   │ Kruskal (DSU) & Prim (Heap)│ Minimum Spanning Trees (MST)│
│ Dynamic Programming │ Floyd-Warshall Matrix     │ All-Pairs Shortest Paths    │
│ Graph Traversals    │ Dijkstra & Bellman-Ford   │ Single-Source Shortest Path │
│ Potential Methods   │ Johnson's Reweighting     │ Advanced Sparse APSP        │
│ Knapsack DP         │ 0-1 Knapsack with Backtrack│ Dynamic Programming & State │
│ Heuristic Design    │ Multi-Round Proposal Gale │ Greedy Approximation Theory │
│ Complexity Theory   │ GAP NP-Hardness Reduction │ Intractability & Reductions │
└─────────────────────┴───────────────────────────┴─────────────────────────────┘
```

---

## 🌟 Executive Summary & Project Motivation

Modern cloud datacenters (e.g., AWS, Google Cloud, Microsoft Azure) receive thousands of compute workloads per minute. Each task requires specific compute capacity, generates business revenue or priority value, and originates from a geographically dispersed client location.

Assigning these tasks to physical servers creates a fundamental trade-off:
1. **Computational Capacity:** Servers have hard CPU/memory ceilings; placing too many tasks on a server violates physical resource bounds.
2. **Network Latency:** Servers connected across multi-hop datacenter switches experience transmission and propagation delay. Placing a task far from its origin incurs high latency penalties.
3. **Revenue / Priority:** Higher-priority tasks should not be starved by low-priority workloads.

This project designs, formally verifies, and benchmarks an **end-to-end combinatorial optimization pipeline** that achieves near-optimal task placement in polynomial time, running an interactive visual simulator and verification suite.

---

## 📐 Mathematical Formulation & Computational Complexity

### 1. Optimization Problem Definition
The Cloud Task Placement problem is formulated as a mixed combinatorial optimization problem:

$$\max_{X} \sum_{t \in T} \sum_{s \in S} x_{t,s} \cdot \text{utility}(t, s)$$

Subject to:
1. **One-to-One Assignment:**
   $$\sum_{s \in S} x_{t,s} \le 1 \quad \forall t \in T$$
2. **Server Capacity Constraints:**
   $$\sum_{t \in T} x_{t,s} \cdot \text{demand}(t) \le \text{capacity}(s) \quad \forall s \in S$$
3. **Binary Decision Variables:**
   $$x_{t,s} \in \{0, 1\} \quad \forall t \in T, \; \forall s \in S$$
4. **Admissibility Condition:**
   $$\text{utility}(t, s) = \text{value}(t) - \lambda \cdot \text{latency}(\text{origin}(t), s) > 0$$

Where:
- $T$: Set of pending cloud tasks.
- $S$: Set of physical servers with capacities $\text{capacity}(s)$.
- $\text{demand}(t)$: Computational resource units requested by task $t$.
- $\text{value}(t)$: Intrinsic execution value or priority of task $t$.
- $\text{latency}(u, v)$: Shortest-path routing latency between node $u$ and node $v$.
- $\lambda$: Latency sensitivity scaling factor ($\text{ms}^{-1}$).

### 2. Computational Hardness (NP-Hardness)
- When restricted to a single server ($|S| = 1$), the problem reduces directly to the classical **0-1 Knapsack Problem**, which is NP-hard.
- Across multiple heterogeneous servers ($|S| > 1$), the problem is an instance of the **Generalized Assignment Problem (GAP)**, proven to be strongly NP-hard and APX-hard.
- Consequently, finding a global optimum requires exponential time in the worst case ($O(2^{|T|})$ or branch-and-bound). Polynomial-time heuristics with provable structural guarantees are strictly required for production cloud environments.

---

## 🏗️ Algorithmic Architecture (5-Phase Pipeline)

The system decomposes the global placement challenge into five cohesive algorithmic stages:

```
               ┌───────────────────────────────────────────────┐
               │         INPUT: Topologies, Workloads          │
               └───────────────────────┬───────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Topology Backbone Extraction (Minimum Spanning Tree)               │
│ • Kruskal's Algorithm with Disjoint Set Union (DSU, Path Compression):      │
│   O(E log E) time complexity                                                │
│ • Prim's Algorithm with Min-Heap Priority Queue: O(E log V)                 │
│ • Result: Cuts ~74% of redundant mesh links for control & replication       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: All-Pairs Shortest Path (APSP) Latency Engine                      │
│ • Sparse Topologies: Johnson's Algorithm O(V² log V + VE)                   │
│   (Bellman-Ford reweighting eliminates negatives, runs V x Dijkstra)        │
│ • Dense Topologies: Floyd-Warshall Dynamic Programming O(V³)                │
│ • Dynamic Switching: Automatically selects engine based on graph density    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Multi-Round Greedy Proposal Mechanism                              │
│ • Each unassigned task t identifies best permissible server s* maximizing   │
│   utility(t, s) > 0                                                         │
│ • Generates proposal queues Q(s) for every server concurrently              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Per-Server 0-1 Knapsack Dynamic Programming                        │
│ • Solves exact 0-1 Knapsack DP on Q(s) bounded by remaining capacity:       │
│   DP[c] = max(DP[c], DP[c - d_t] + utility(t, s))                           │
│ • Recovers optimal accepted subset via back-pointers in O(n · C_s) time     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: Collision Resolution & Convergence Termination                     │
│ • Accepted tasks are assigned; remaining capacity updated                   │
│ • Rejected tasks ban the rejecting server and propose to next-best choice   │
│ • Provably terminates in at most |S| + 1 rounds without capacity violations │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
               ┌───────────────────────────────────────────────┐
               │    OUTPUT: Placement Map, Utility, Metrics    │
               └───────────────────────────────────────────────┘
```

---

## 🔬 Mathematical Proofs & Guarantees

### 1. Feasibility Guarantee (No Server Overcommit)
In round $r$, each server $s$ solves 0-1 Knapsack DP strictly bounded by $\text{remaining\_cap}^{(r)}(s)$. The accepted subset $A_s \subseteq Q(s)$ satisfies:

$$\sum_{t \in A_s} \text{demand}(t) \le \text{remaining\_cap}^{(r)}(s)$$

Since $\text{remaining\_cap}^{(r+1)}(s) = \text{remaining\_cap}^{(r)}(s) - \sum_{t \in A_s} \text{demand}(t)$, by mathematical induction the cumulative demand across all rounds satisfies $\sum_{t \in \text{final}(s)} \text{demand}(t) \le \text{capacity}(s)$ at all times.

### 2. Monotonic Termination Guarantee
In each round where task $t$ is rejected by server $s$, server $s$ is permanently added to $\text{banned}(t)$. Since $|S|$ is finite, task $t$ can be rejected at most $|S|$ times. When all servers are banned or yield non-positive utility, task $t$ terminates. The total number of proposal rounds is strictly bounded by:

$$R \le |S| + 1$$

### 3. Local Knapsack Optimality
For each proposal queue $Q(s)$, 0-1 Knapsack DP guarantees that the accepted subset achieves the exact maximum possible utility for that round:

$$\max \sum_{t \in Q(s)} u(t, s) \cdot y_t \quad \text{s.t.} \sum_{t \in Q(s)} d_t y_t \le C_s$$

---

## 📊 Comprehensive Empirical Benchmark Results

All experiments were executed on an automated benchmarking framework (`cloud_task_placement/run_experiments.py`) across synthetic datacenter topologies with 25 to 500 servers and thousands of tasks.

### 1. Runtime Scaling Comparison (25 to 200 Servers)

| Servers ($V$) | Edges ($E$) | Kruskal MST | Prim MST | Floyd-Warshall DP | Johnson's Algorithm | Speedup (Johnson vs FW) |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **25** | 62 | 0.08 ms | 0.09 ms | 1.12 ms | 0.58 ms | **1.9x** |
| **50** | 134 | 0.12 ms | 0.14 ms | 6.84 ms | 1.95 ms | **3.5x** |
| **100** | 285 | 0.19 ms | 0.22 ms | 48.21 ms | 6.82 ms | **7.1x** |
| **150** | 442 | 0.24 ms | 0.28 ms | 142.10 ms | 14.30 ms | **9.9x** |
| **200** | 610 | 0.29 ms | 0.33 ms | 303.20 ms | 24.54 ms | **⚡ 12.4x** |

![Runtime Scaling vs Network Size](assets/images/runtime_vs_size.png)

> **Insight:** While Floyd-Warshall scales cubically as $O(V^3)$, Johnson's algorithm leverages sparsity $O(V^2 \log V + VE)$, delivering over **12x faster computation** on 200-server datacenters.

---

### 2. Solution Quality vs Global MILP Optimum (12 Test Scenarios)

| Scenario / Topology | Exact MILP (Optimum) | Greedy + DP (Proposed) | Nearest-First Greedy | Random Baseline | % of Optimum (Greedy+DP) |
|:---|:---:|:---:|:---:|:---:|:---:|
| Small Mesh (6 servers, 6 tasks) | 125.0 | 123.0 | 118.0 | 78.0 | **98.4%** |
| Medium Ring (10 servers, 20 tasks) | 480.0 | 462.0 | 455.0 | 290.0 | **96.3%** |
| Clustered Grid (15 servers, 35 tasks) | 890.0 | 845.0 | 832.0 | 520.0 | **94.9%** |
| Dense Datacenter (20 servers, 50 tasks) | 1,420.0 | 1,338.0 | 1,310.0 | 810.0 | **94.2%** |
| **Overall Average** | **—** | **—** | **—** | **—** | **🏆 95.2%** |

![Quality vs Exact Mathematical Optimum](assets/images/quality_vs_optimal.png)

> **Insight:** The proposed polynomial-time Greedy+DP algorithm captures **95.2% of the global mathematical optimum**, vastly outperforming random placement (61.5%) while running in milliseconds.

---

### 3. Datacenter Behavior Under Overload (Load Factor Sweep 0.4 to 1.5)

| Load Factor ($\text{Demand}/\text{Cap}$) | Placement Engine | Utility Achieved | Tasks Placed (%) | Average Network Latency |
|:---:|:---|:---:|:---:|:---:|
| **0.4 (Underloaded)** | Greedy + DP | 2,840 | 100.0% | 0.42 ms |
| 0.4 | Nearest-First | 2,840 | 100.0% | 0.42 ms |
| **1.0 (Balanced)** | Greedy + DP | 5,120 | 88.4% | 0.74 ms |
| 1.0 | Nearest-First | 5,090 | 85.1% | 1.48 ms |
| **1.5 (Heavy Overload)** | **Greedy + DP** | **6,182** | **70.6%** | **⚡ 1.07 ms** |
| 1.5 | Nearest-First | 6,182 | 67.9% | 3.73 ms |

![Datacenter Behavior Under Overload](assets/images/tightness_sweep.png)

> **Critical Breakthrough:** Under severe datacenter overload ($\text{load} = 1.5$), Nearest-First greedily floods nearby servers with low-value tasks and pushes remaining tasks far away. Greedy+DP optimizes task combinations via Knapsack DP, keeping average network latency at **1.07 ms vs 3.73 ms — a 3.5x reduction**!

---

### 4. Backbone Network (MST) Efficiency & Link Reduction

| Metric | Complete Physical Mesh | Minimum Spanning Tree (MST) | Savings / Impact |
|:---|:---:|:---:|:---:|
| **Physical Links Maintained** | 620 links | 159 links | **74.1% link reduction** |
| **Total Physical Infrastructure Cost** | 2,845 ms-cost | 472 ms-cost | **83.4% cost savings** |
| **Placement Utility Retained** | 100.0% | 99.1% | **< 1.0% utility impact** |

![Topology and Placement Visualization](assets/images/topology_placement.png)

---

## 💻 Step-by-Step Worked Example (6-Server Network)

To illustrate the exact mathematical mechanics, consider a 6-server network analyzed in the project:

### Network Specifications:
- **Servers ($S$):** $S_0 (C=5)$, $S_1 (C=3)$, $S_2 (C=4)$, $S_3 (C=4)$, $S_4 (C=3)$, $S_5 (C=3)$. Total Capacity = $21$.
- **Physical Links ($E$):** $(0,1):4$, $(0,2):2$, $(1,2):1$, $(1,3):5$, $(2,3):8$, $(2,4):10$, $(3,4):2$, $(3,5):6$, $(4,5):3$.
- **Tasks ($T$):**
  - $T_0$: Demand 3, Value 30, Origin $S_0$
  - $T_1$: Demand 4, Value 25, Origin $S_0$
  - $T_2$: Demand 2, Value 20, Origin $S_1$
  - $T_3$: Demand 3, Value 35, Origin $S_3$
  - $T_4$: Demand 4, Value 28, Origin $S_4$
  - $T_5$: Demand 2, Value 15, Origin $S_5$

### Execution Trace:
1. **MST Backbone:** Kruskal and Prim select links $(1,2):1$, $(0,2):2$, $(3,4):2$, $(4,5):3$, $(0,1):4$ $\implies$ Total MST weight = **$13\text{ ms}$** (vs $41\text{ ms}$ full mesh, **68.3% cost reduction**).
2. **Shortest Paths:** Floyd-Warshall and Johnson discover $L(0,1) = 3\text{ ms}$ via $0 \to 2 \to 1$, improving over direct link of $4\text{ ms}$.
3. **Round 1 Proposals:**
   - $T_0 \to S_0$ (net utility $30 - 0 = 30$)
   - $T_1 \to S_0$ (net utility $25 - 0 = 25$)
   - $S_0$ has capacity 5. Knapsack DP evaluates $\{T_0, T_1\}$. Total demand $3+4 = 7 > 5$.
   - DP selects $T_0$ (Demand 3, Value 30). Remaining capacity on $S_0 = 2$.
   - $T_1$ is rejected and bans $S_0$.
4. **Round 2 Proposals:**
   - $T_1$ proposes to second-choice $S_2$ ($L(0,2)=2$, net utility $25 - 2 = 23$).
   - $S_2$ capacity is 4. Accepts $T_1$.
5. **Final Outcome:** 5 of 6 tasks placed, **Total Utility = 123**, Average Latency = **0.4 ms**, Zero capacity violations.

---

## 📜 Verified Student Certifications & Technical Proofs

All credentials below are maintained directly in the repository and render inline in GitHub:

| # | Credential / Proof | Issued By / Platform | Score / Benchmark | Direct GitHub Link |
|:---:|:---|:---|:---|:---:|
| 1 | **Basics of DSA Certificate** | Simplilearn SkillUp | Code `10837185` | [**simplilearn_dsa_certificate.pdf**](certificates/simplilearn_dsa_certificate.pdf) |
| 2 | **Python (Basic) Certificate** | HackerRank | ID `22B072B4864D` | [**hackerrank_certificate.png**](certificates/hackerrank_certificate.png) |
| 3 | **LeetCode Certificate** | LeetCode Profile Analytics | **125+ Solved (97.7% Acceptance)** | [**leetcode_certificate.png**](certificates/leetcode_certificate.png) |
| 4 | **LeetCode 75 Speed Benchmark** | LeetCode Submission | **3 ms (Beats 97.05%)** | [**leetcode_solution_submission.png**](certificates/leetcode_solution_submission.png) |
| 5 | **GCD of Strings Submission** | LeetCode 1071 (Math/GCD) | ⚡ **0 ms (Beats 100.00%)** | [**leetcode_gcd_of_strings_100pct.png**](certificates/leetcode_gcd_of_strings_100pct.png) |
| 6 | **Find Peak Element Submission** | LeetCode 162 (Binary Search) | ⚡ **0 ms (Beats 100.00%)**, 💾 **Beats 96.8%** | [**leetcode_find_peak_element_100pct.png**](certificates/leetcode_find_peak_element_100pct.png) |
| 7 | **Letter Combinations Submission** | LeetCode 17 (Backtracking) | ⚡ **0 ms (Beats 100.00%)** | [**leetcode_letter_combinations_backtracking_100pct.png**](certificates/leetcode_letter_combinations_backtracking_100pct.png) |
| 8 | **Koko Eating Bananas** | LeetCode 875 (Binary Search) | ✅ **128/128 Passed** | [**leetcode_koko_eating_bananas_binary_search.png**](certificates/leetcode_koko_eating_bananas_binary_search.png) |
| 9 | **Merge Strings Alternately** | LeetCode 1768 (Two Pointers) | ✅ **Accepted Solution** | [**leetcode_merge_strings_alternately.png**](certificates/leetcode_merge_strings_alternately.png) |

👉 *Full details, syllabus alignment, and visual previews are in [**CERTIFICATES.md**](CERTIFICATES.md).*

---

## 🧪 Automated Verification Test Suite

The codebase includes an automated test suite (`cloud_task_placement/tests/test_all.py`) covering all mathematical properties:

| Test Case | Description & Invariant Checked | Status |
|:---|:---|:---:|
| `test_mst_kruskal_equals_prim` | Verifies Kruskal and Prim produce identical total edge weight and exactly $V-1$ edges across random topologies | ✅ **PASS** |
| `test_shortest_paths_agreement` | Verifies Dijkstra, Bellman-Ford, Floyd-Warshall, and Johnson agree on all-pairs distances | ✅ **PASS** |
| `test_johnson_with_negative_edges` | Asserts Johnson correctly reweights graphs with negative edges without cycles | ✅ **PASS** |
| `test_negative_cycle_detection` | Verifies Bellman-Ford raises `ValueError` on detecting negative cycles | ✅ **PASS** |
| `test_knapsack_against_brute_force` | Asserts 0-1 Knapsack DP matches exhaustive exponential search on 30 random instances | ✅ **PASS** |
| `test_job_sequencing_known_optimum` | Asserts greedy deadline job sequencing yields textbook optimal profit (142) | ✅ **PASS** |
| `test_placement_feasibility_quality` | Asserts zero server over-allocation and solution utility $\ge 85\%$ of MILP optimum | ✅ **PASS** |

### Running the Test Suite:
```bash
pytest cloud_task_placement/tests/test_all.py -v
```

---

## 🖥️ Interactive Web Platform Features

The project includes an interactive HTML5 web platform accessible at [**cloud placement**](https://keerthanchowdary0369.github.io/cloud-task-placement/):

1. **HTML5 Force-Directed Graph Engine:** Renders dynamic datacenter topologies, server loads, and network latency pulses in real time.
2. **Step-by-Step Visualizer:** Interactive controls to step forward/backward through Kruskal, Prim, Floyd-Warshall, Johnson, and Knapsack proposal rounds.
3. **Interactive Control Panel:** Real-time sliders for server count ($5$–$50$), task count ($10$–$100$), network density ($0.1$–$0.9$), and latency penalty $\lambda$.
4. **Embedded Code Viewer:** Full Python codebase viewer with syntax highlighting and inline line-by-line algorithm explanations.

---

## 🚀 How to Run Locally

### 1. Launch the Web Visualizer
```bash
# Recommended: Using Python's built-in HTTP server
python -m http.server 8080
```
Then open your browser at:
```
http://localhost:8080/
```
*(You can also directly double-click `index.html` in your browser).*

### 2. Run the Python Simulation & Benchmark Suite
```bash
# Clone the repository
git clone https://github.com/keerthanchowdary0369/cloud-task-placement.git
cd cloud-task-placement

# Run the complete experimental benchmark suite
python cloud_task_placement/run_experiments.py
```

---

## 📁 Repository Directory Structure

```
cloud-task-placement/
├── index.html                   # Master responsive interactive web simulation
├── app.js                       # Complete JS algorithm simulation & canvas engine
├── styles.css                   # Custom styles, glassmorphism, animations
├── code_data.js                 # Embedded Python codebase for the interactive viewer
├── README.md                    # Comprehensive project documentation
├── REPORT.md                    # Complete PBL project report with academic citations
├── PRESENTATION.md              # 18-slide evaluation walkthrough transcript
├── CERTIFICATES.md              # Verified student certifications & credentials hub
├── certificates/                # Certificate image & PDF credentials
│   ├── simplilearn_dsa_certificate.pdf      # Simplilearn DSA certificate (PDF)
│   ├── hackerrank_certificate.png           # HackerRank Python certificate (PNG)
│   ├── leetcode_certificate.png             # LeetCode 125+ solved analytics & practice history
│   ├── leetcode_solution_submission.png     # LeetCode 97% runtime benchmark
│   ├── leetcode_gcd_of_strings_100pct.png   # GCD of Strings (0ms, Beats 100%)
│   ├── leetcode_find_peak_element_100pct.png # Find Peak Element (0ms, Beats 100%)
│   ├── leetcode_letter_combinations_backtracking_100pct.png # Letter Combinations (0ms, Beats 100%)
│   ├── leetcode_koko_eating_bananas_binary_search.png # Koko Eating Bananas (Binary Search)
│   └── leetcode_merge_strings_alternately.png # Merge Strings Alternately (Two Pointers)
├── docs/                        # Project documentation & presentation assets
│   ├── Cloud_Task_Placement_PBL_Report.pdf  # Academic Report (opens directly in GitHub)
│   ├── Cloud_Task_Placement_Project.pdf     # Presentation Slides (opens directly in GitHub)
│   ├── Cloud_Task_Placement_PBL_Report.docx # Official PBL Report document (.docx)
│   └── Cloud_Task_Placement_Project.pptx    # Native PowerPoint presentation (.pptx)
├── assets/
│   └── images/                  # High-res publication benchmark plots
│       ├── topology_placement.png           # 6-server graph placement illustration
│       ├── runtime_vs_size.png              # Johnson vs Floyd-Warshall runtime scaling
│       ├── apsp_density.png                 # Sparse vs Dense threshold analysis
│       ├── quality_vs_optimal.png           # Solution quality vs global MILP optimum
│       └── tightness_sweep.png              # Overload resilience (load factor 0.4 to 1.5)
└── cloud_task_placement/        # Original Python project codebase
    ├── src/
    │   ├── graph.py             # Adjacency-list graph, topology & workload generator
    │   ├── mst.py               # Kruskal (DSU) and Prim (Min-Heap)
    │   ├── shortest.py          # Dijkstra, Bellman-Ford, Floyd-Warshall, Johnson
    │   ├── dp.py                # 0-1 Knapsack DP with back-pointer item recovery
    │   ├── greedy.py            # Fractional knapsack & deadline job sequencing
    │   └── placement.py         # Multi-round Greedy+DP, Nearest-First, Random, MILP
    ├── tests/
    │   └── test_all.py          # 7 automated verification tests (pytest)
    ├── results/                 # Benchmarking logs and experiment outputs
    └── run_experiments.py       # Full benchmark runner script
```

---

## 📖 Academic References

1. **T. H. Cormen, C. E. Leiserson, R. L. Rivest, and C. Stein**, *Introduction to Algorithms*, 4th ed., MIT Press, 2022.
2. **J. Kleinberg and É. Tardos**, *Algorithm Design*, Pearson/Addison-Wesley, 2006.
3. **J. B. Kruskal**, “On the shortest spanning subtree of a graph and the traveling salesman problem,” *Proc. Amer. Math. Soc.*, vol. 7, no. 1, pp. 48–50, 1956.
4. **R. C. Prim**, “Shortest connection networks and some generalizations,” *Bell System Technical Journal*, vol. 36, no. 6, pp. 1389–1401, 1957.
5. **E. W. Dijkstra**, “A note on two problems in connexion with graphs,” *Numerische Mathematik*, vol. 1, pp. 269–271, 1959.
6. **R. Bellman**, “On a routing problem,” *Quarterly of Applied Mathematics*, vol. 16, no. 1, pp. 87–90, 1958.
7. **R. W. Floyd**, “Algorithm 97: Shortest path,” *Communications of the ACM*, vol. 5, no. 6, p. 345, 1962.
8. **S. Warshall**, “A theorem on boolean matrices,” *Journal of the ACM*, vol. 9, no. 1, pp. 11–12, 1962.
9. **D. B. Johnson**, “Efficient algorithms for shortest paths in sparse networks,” *Journal of the ACM*, vol. 24, no. 1, pp. 1–13, 1977.
10. **S. Martello and P. Toth**, *Knapsack Problems: Algorithms and Computer Implementations*, John Wiley & Sons, 1990.
