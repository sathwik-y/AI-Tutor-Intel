import matplotlib.pyplot as plt
import os
import uuid

def maybe_generate_visual(text: str) -> str | None:
    if "chart" in text or "graph" in text:
        x = [1, 2, 3, 4]
        y = [10, 5, 8, 12]
        plt.plot(x, y)
        plt.title("Generated Chart")
        img_name = f"{uuid.uuid4()}.png"
        img_path = os.path.join("static", img_name)
        plt.savefig(img_path)
        return f"/static/{img_name}"
    return None
