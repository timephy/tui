from generate_colors import colors
from generate_step_colors_two_parts import colors as colors_steps
from base_colors import colors as colors_base

colors = [*colors_base, *colors_steps, *colors]

# CSS Colors

colors_rgb_light = [
    f"--{color.name}-rgb-light: {color.light[0]}, {color.light[1]}, {color.light[2]};" for color in colors
]
color_rgbs_dark = [
    f"--{color.name}-rgb-dark: {color.dark[0]}, {color.dark[1]}, {color.dark[2]};" for color in colors
]

colors_light = [
    f"--{color.name}-light: rgb(var(--{color.name}-rgb-light));" for color in colors
]
colors_dark = [
    f"--{color.name}-dark: rgb(var(--{color.name}-rgb-dark));" for color in colors
]

colors_rgb_if_light = [
    f"--{color.name}-rgb: var(--{color.name}-rgb-light);" for color in colors
]
colors_rgb_if_dark = [
    f"--{color.name}-rgb: var(--{color.name}-rgb-dark);" for color in colors
]

colors_def = [
    f"--{color.name}: rgb(var(--{color.name}-rgb));" for color in colors
]

# Tailwind Color Config

tailwind_config_colors_light = [
    f"\"{color.name}-light\": \"rgb(var(--{color.name}-rgb-light), <alpha-value>)\"," for color in colors
]
tailwind_config_colors_dark = [
    f"\"{color.name}-dark\": \"rgb(var(--{color.name}-rgb-dark), <alpha-value>)\"," for color in colors
]
tailwind_config_colors = [
    f"\"{color.name}\": \"rgb(var(--{color.name}-rgb), <alpha-value>)\"," for color in colors
]

# Export format

content_colors_rgb_light = "\n".join(colors_rgb_light)
content_color_rgbs_dark = "\n".join(color_rgbs_dark)
content_colors_light = "\n".join(colors_light)
content_colors_dark = "\n".join(colors_dark)
content_colors_rgb_if_light = "\n".join(colors_rgb_if_light)
content_colors_rgb_if_dark = "\n".join(colors_rgb_if_dark)
content_colors_def = "\n".join(colors_def)

content = f"""
html {{
{content_colors_rgb_light}
}}

html {{
{content_color_rgbs_dark}
}}

html {{
{content_colors_light}
}}

html {{
{content_colors_dark}
}}

html {{
{content_colors_rgb_if_light}
}}

html.dark {{
{content_colors_rgb_if_dark}
}}

html {{
{content_colors_def}
}}
"""

content_tailwind_config_colors_light = "\n".join(tailwind_config_colors_light)
content_tailwind_config_colors_dark = "\n".join(tailwind_config_colors_dark)
content_tailwind_config_colors = "\n".join(tailwind_config_colors)

content_tailwind = f"""
{content_tailwind_config_colors_light}
{content_tailwind_config_colors_dark}
{content_tailwind_config_colors}
"""

with open('../export/colors.css', 'w') as f:
    f.write(content)

with open('../export/tailwind-colors.txt', 'w') as f:
    f.write(content_tailwind)
