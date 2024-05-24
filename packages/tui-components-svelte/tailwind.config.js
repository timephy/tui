import tui_colors from "@timephy/tui-colors-tw"
import tui_components from "@timephy/tui-components-tw"

/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{html,js,svelte,ts}"],
    theme: {
        extend: {},
    },
    plugins: [
        //
        tui_colors({}),
        tui_components({}),
    ],
}
