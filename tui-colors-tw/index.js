const plugin = require("tailwindcss/plugin")
const { default: colors, colors_tailwind } = require("./colors")

export default plugin.withOptions(
    function (options = {}) {
        return function ({ config, addBase }) {
            colors({ config, addBase })
        }
    },
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
