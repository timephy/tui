/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{html,js,svelte,ts}"],
    theme: {
        extend: {},
    },
    plugins: [
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require("@timephy/tui-colors-tw")({}),
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require("@timephy/tui-components-tw")({}),
    ],
}
