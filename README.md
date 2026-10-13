# Cloud Task Placement — Interactive Research & Simulation Website

### 🚀 Quick Links:
- 🌐 **Live Website:** [cloud placement](https://keerthanchowdary0369.github.io/cloud-task-placement/)
- 📊 **Presentation Slides (18 Slides):** [**PRESENTATION.md**](PRESENTATION.md) *(Directly opens in GitHub)*
- 📑 **Full Academic Report:** [**REPORT.md**](REPORT.md) *(Directly opens in GitHub)*
- 📥 **Download PowerPoint (.pptx):** [**Cloud_Task_Placement_Project.pptx**](docs/Cloud_Task_Placement_Project.pptx)

**Design and Analysis of Algorithms | Internal Project**  
**Institution:** Woxsen University, School of Technology  
**Program:** B.Tech Computer Science & Engineering (2025–2029)  
**Faculty Guide:** Dr. Syed Javeed Pasha  

---

## 👥 Project Team
1. **Andrew Devasani** — `25WU0102067`
2. **Sathyanarayana Varma** — `25WU0102088`
3. **G. Daiwik Reddy** — `25WU0102340`
4. **G. Keerthan Chowdary** — `25WU0102076`

---

## 🌟 Overview & Key Innovations

This project implements an end-to-end combinatorial optimization pipeline for cloud task placement (mapping virtual machines / containers to physical datacenter servers) while balancing computational capacity constraints and network communication latency penalties.

- **Objective Function:** $\text{utility}(t, s) = \text{value}(t) - \lambda \cdot \text{latency}(\text{origin}(t), s)$, with $\lambda = 1.0$.
- **Combinatorial Classification:** Generalized Assignment Problem (GAP), proven NP-hard.
- **Backbone Reduction:** Kruskal (Union-Find) and Prim (Min-Heap) cut ~74% of physical mesh links for control & replication traffic.
- **Latency Matrix:** Automated dual-engine selection using Johnson's Algorithm for sparse meshes and Floyd-Warshall DP for dense topologies.
- **Task Placement Engine:** Multi-round proposal heuristic combining greedy preferences with per-server 0-1 Knapsack Dynamic Programming.

---

## 📊 Benchmark Findings

1. **Solution Quality:** The proposed Greedy+DP pipeline achieves **95.2% of the global MILP optimum** on tested instances.
2. **Overload Resilience:** Under heavy load ($\text{load} = 1.5$), Greedy+DP achieves **1.07 ms average latency vs 3.73 ms for Nearest-First (3.5x lower)** at identical total utility.
3. **Sparse APSP Speedup:** Johnson's algorithm is **12x faster than Floyd-Warshall at 200 servers** (24.5 ms vs 303.2 ms).
4. **Backbone Efficiency:** MST backbone achieves **73.4%–74.1% link savings** and **82%–84% cost savings** with a 1.76x–2.68x latency stretch.

---

## 🌐 Live Website Access
The interactive visualization and simulation platform is available online at:  
👉 **[cloud placement](https://keerthanchowdary0369.github.io/cloud-task-placement/)**

---

## 🚀 How to Run the Website Locally

### Option 1: Python HTTP Server (Recommended)
```bash
py -m http.server 8080
```
Then open your browser at:
```
http://localhost:8080/
```

### Option 2: Direct File Open
You can also directly double-click `index.html` to open it in any modern web browser (Chrome, Edge, Firefox, Safari).

---

## 📁 Directory Structure
```
cloud-task-placement-web/
├── index.html                   # Master responsive web application
├── app.js                       # Complete JS algorithm simulation & canvas engine
├── styles.css                   # Custom styles, glassmorphism, animations
├── code_data.js                 # Embedded Python codebase for the interactive viewer
├── assets/
│   └── images/                  # High-res publication benchmark plots
│       ├── topology_placement.png
│       ├── runtime_vs_size.png
│       ├── apsp_density.png
│       ├── quality_vs_optimal.png
│       └── tightness_sweep.png
├── cloud_task_placement/        # Original Python project codebase
│   ├── src/                     # Python source files (graph, mst, shortest, dp, greedy, placement)
│   ├── tests/                   # 7 automated verification tests
│   ├── results/                 # Benchmarks and experimental figures
│   └── run_experiments.py       # Full benchmark runner script
└── README.md                    # Project documentation
```
