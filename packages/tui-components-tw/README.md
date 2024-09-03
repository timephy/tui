# tui-components-tw

This is a tailwind plugin that adds many component styles and utility classes.

## How to install

```bash
npm install @timephy/tui-components-tw
```

Add it to your `tailwind.config.js`:

```js
import tui_colors from "@timephy/tui-colors-tw"
import tui_components from "@timephy/tui-components-tw"

/** @type {import('tailwindcss').Config} */
module.exports = {
    ...
    content: [
        "./src/**/*.{html,js,svelte,ts}", // default for a SvelteKit project
        "./node_modules/@timephy/tui-components-svelte/**/*.{html,js,svelte,ts}", // required
    ],
    ...
    plugins: [
        tui_colors({}), // before tui_components
        tui_components({}),
        ...
    ],
}
```
