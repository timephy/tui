const plugin = require("tailwindcss/plugin")
const { default: colors, colors_tailwind } = require("./colors")

module.exports = plugin.withOptions(
    function (options = {}) {
        return function ({ config, addBase }) {
            colors({ config, addBase })
        }
    },
    function (options = {}) {
        return {
            theme: {
                colors: {
                    black: "#000",
                    white: "#fff",
                    ...colors_tailwind,
                },
            },
        }
    },
)
