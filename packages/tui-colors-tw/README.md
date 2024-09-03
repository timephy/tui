# tui-colors-tw

This is a tailwind plugin that adds a selection of colors.

There are automatic or manual light and dark mode variants.

- CSS Variables `--COLOR-XXX`, `--COLOR-XXX-light`, `--COLOR-XXX-dark` (+ `...-value`)
- Tailwind Colors `COLOR-XXX`, `COLOR-XXX-light`, `COLOR-XXX-dark`

## How to install

```bash
npm install @timephy/tui-colors-tw
```

Add it to your `tailwind.config.js`:

```js
import tui_colors from "@timephy/tui-colors-tw"

/** @type {import('tailwindcss').Config} */
module.exports = {
    ...
    darkMode: "class", // supports "media" (default) and "class"
    ...
    plugins: [
        tui_colors({}),
        ...
    ],
}
```

## List of colors

```txt
black
white

primary (black in light mode, white in dark mode)
secondary (step-700)
tertiary (step-500)

step-base
step-000 to step-900

[COLOR-000 to COLOR-250]
red
orange
yellow
green
mint
teal
cyan
blue
indigo
purple
pink
brown
gray
```

---

Colors are originally inspired by [Apple Design Color](https://developer.apple.com/design/human-interface-guidelines/color).
