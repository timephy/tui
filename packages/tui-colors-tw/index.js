import plugin from "tailwindcss/plugin"
import { default as colors, colors_tailwind } from "./colors"

export default plugin.withOptions(
    // eslint-disable-next-line no-unused-vars
    function (options = {}) {
        return function ({ config, addBase }) {
            colors({ config, addBase })
        }
    },
    // eslint-disable-next-line no-unused-vars
    function (options = {}) {
        return {
            theme: {
                colors: {
                    black: "#000000",
                    white: "#ffffff",
                    ...colors_tailwind,
                },
            },
        }
    },
)
