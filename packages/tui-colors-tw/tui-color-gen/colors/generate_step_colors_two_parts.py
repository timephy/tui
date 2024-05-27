from pprint import pprint
import numpy as np

from color import TUI_Color

N_1 = 5 + 5  # 000-450
N_2 = 5 + 4  # 500-900
N = N_1 + N_2

steps = np.linspace(0, 900, N).astype(int)
print(f'{steps = }')

values_1 = np.linspace(23, 105, N_1)
values_2 = np.linspace(155, 255, N_2)

values = np.rint(np.concatenate((values_1, values_2))).astype(int)
print(f'{values = }')

for val in values:
    print(val)

# Export

colors = [
    TUI_Color(
        f"step-{step:03d}",
        (value_light, value_light, value_light),
        (value_dark, value_dark, value_dark)
    )
    for step, value_light, value_dark in zip(steps, values[::-1], values)
]
pprint(colors)
