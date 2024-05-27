from pprint import pprint
from dataclasses import dataclass
from colour import Color
import numpy as np

from color import TUI_Color


with open("../source-colors-from-apple.txt", "r") as f:
    source_colors = f.readlines()
source_colors = [x.strip() for x in source_colors]

LINES_PER_COLOR = 7
count_colors = len(source_colors) // LINES_PER_COLOR


@dataclass
class Local_Color:
    name: str

    light_000: Color
    dark_000: Color

    light_050: Color
    light_100: Color
    light_150: Color
    light_200: Color
    light_250: Color

    dark_050: Color
    dark_100: Color
    dark_150: Color
    dark_200: Color
    dark_250: Color

    def __init__(self, name: str, light: Color, dark: Color):
        self.name = name

        dark = Color(dark)
        dark.set_luminance(dark.get_luminance() * 0.85)
        dark.set_saturation(dark.get_saturation() * 0.8)

        self.dark_000 = Color(dark)
        self.dark_000.set_luminance(dark.get_luminance() * 1.0)
        self.dark_050 = Color(dark)
        self.dark_050.set_luminance(dark.get_luminance() * 1.075)
        self.dark_100 = Color(dark)
        self.dark_100.set_luminance(dark.get_luminance() * 1.1)
        self.dark_150 = Color(dark)
        self.dark_150.set_luminance(dark.get_luminance() * 1.175)
        self.dark_200 = Color(dark)
        self.dark_200.set_luminance(dark.get_luminance() * 1.25)
        self.dark_250 = Color(dark)
        self.dark_250.set_luminance(dark.get_luminance() * 1.325)

        light = Color(light)
        light.set_luminance(light.get_luminance() * 1.5)
        # light.set_saturation(light.get_saturation() * 0.8)

        self.light_000 = Color(light)
        self.light_000.set_luminance(light.get_luminance() * 1.0)
        self.light_050 = Color(light)
        self.light_050.set_luminance(light.get_luminance() * 0.925)
        self.light_100 = Color(light)
        self.light_100.set_luminance(light.get_luminance() * 0.9)
        self.light_150 = Color(light)
        self.light_150.set_luminance(light.get_luminance() * 0.825)
        self.light_200 = Color(light)
        self.light_200.set_luminance(light.get_luminance() * 0.75)
        self.light_250 = Color(light)
        self.light_250.set_luminance(light.get_luminance() * 0.675)


local_colors: list[Local_Color] = []
for i in range(count_colors):
    source = source_colors[i*LINES_PER_COLOR:i*LINES_PER_COLOR+LINES_PER_COLOR]
    (r_light, g_light, b_light) = [int(x[2:]) for x in source[0:3]]
    (r_dark, g_dark, b_dark) = [int(x[2:]) for x in source[3:6]]

    name = source[6].split("\t")[0].lower()  # "red" | "green" | "blue"
    local_colors.append(Local_Color(name, Color(rgb=(r_light/255, g_light/255, b_light/255)),
                                    Color(rgb=(r_dark/255, g_dark/255, b_dark/255))))


colors: list[TUI_Color] = []
for color in local_colors:
    colors.append(TUI_Color(
        f'{color.name}-000',
        tuple(np.rint(np.array(color.light_000.get_rgb()) * 255).astype(int)),
        tuple(np.rint(np.array(color.dark_000.get_rgb()) * 255).astype(int)),
    ))
    colors.append(TUI_Color(
        f'{color.name}-050',
        tuple(np.rint(np.array(color.light_050.get_rgb()) * 255).astype(int)),
        tuple(np.rint(np.array(color.dark_050.get_rgb()) * 255).astype(int)),
    ))
    colors.append(TUI_Color(
        f'{color.name}-100',
        tuple(np.rint(np.array(color.light_100.get_rgb()) * 255).astype(int)),
        tuple(np.rint(np.array(color.dark_100.get_rgb()) * 255).astype(int)),
    ))
    colors.append(TUI_Color(
        f'{color.name}-150',
        tuple(np.rint(np.array(color.light_150.get_rgb()) * 255).astype(int)),
        tuple(np.rint(np.array(color.dark_150.get_rgb()) * 255).astype(int)),
    ))
    colors.append(TUI_Color(
        f'{color.name}-200',
        tuple(np.rint(np.array(color.light_200.get_rgb()) * 255).astype(int)),
        tuple(np.rint(np.array(color.dark_200.get_rgb()) * 255).astype(int)),
    ))
    colors.append(TUI_Color(
        f'{color.name}-250',
        tuple(np.rint(np.array(color.light_250.get_rgb()) * 255).astype(int)),
        tuple(np.rint(np.array(color.dark_250.get_rgb()) * 255).astype(int)),
    ))

pprint(colors)
