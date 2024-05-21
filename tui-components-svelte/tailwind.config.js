/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {},
    },
    plugins: [
        require("@timephy/tui-colors-tw")({}),
        require("@timephy/tui-components-tw")({}),
    ],
}

