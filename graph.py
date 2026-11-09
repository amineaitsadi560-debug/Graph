"""Plot a graph of the numbers 1 to 100."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

x = list(range(1, 101))
y = x

fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(x, y, marker="o", markersize=3, linewidth=1)
ax.set_title("Graph from 1 to 100")
ax.set_xlabel("n")
ax.set_ylabel("value")
ax.set_xlim(1, 100)
ax.grid(True, alpha=0.3)
fig.tight_layout()
fig.savefig("graph.png", dpi=150)
print("Saved graph.png")
