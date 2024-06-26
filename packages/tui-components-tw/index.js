import plugin from "tailwindcss/plugin"

const defaults = {
    // general
    prefix: "", // "tui-"
    borderWidth: "1px",
    // card
    cardRadius: "2.25rem",
    // item
    itemRadius: "0.75rem",
    // button
    buttonHeight: "40px",
    buttonHeightThin: "32px",
}

const btnColor = (color) => {
    return {
        backgroundColor: `var(--${color}-000)`,
        borderColor: `var(--${color}-050)`,
        "&:hover": {
            backgroundColor: `var(--${color}-100)`,
            borderColor: `var(--${color}-150)`,
        },
        "&:active": {
            backgroundColor: `var(--${color}-200)`,
            borderColor: `var(--${color}-250)`,
        },
    }
}

export default plugin.withOptions(
    function (options = {}) {
        options = { ...defaults, ...options }
        const name = (name) => `.${options.prefix}${name}`

        // eslint-disable-next-line no-unused-vars
        return function ({ theme, addBase, addComponents }) {
            addBase({
                html: {
                    "--border-width": options.borderWidth,
                },
                hr: {
                    color: "var(--step-100)",
                },
            })

            addComponents({
                [name("card")]: {
                    backgroundColor: "var(--step-000)",
                    borderRadius: options.cardRadius,
                    borderWidth: "var(--border-width)",
                    borderColor: "var(--step-050)",
                },
                [name("card-p")]: {
                    padding: `calc(${options.cardRadius} - ${options.itemRadius})`,
                },
                [name("item")]: {
                    backgroundColor: "var(--step-050)",
                    borderRadius: options.itemRadius,
                    borderWidth: "var(--border-width)",
                    borderColor: "var(--step-100)",
                },
                [name("item-p")]: {
                    padding: options.itemRadius,
                },
                [name("btn")]: {
                    backgroundColor: "var(--step-100)",
                    borderRadius: options.itemRadius,
                    borderWidth: "var(--border-width)",
                    borderColor: "var(--step-150)",
                    // height: options.buttonHeight,
                    cursor: "pointer", // for use with <a>
                    userSelect: "none", // for use with <a>
                    display: "flex", // for use with <a>
                    gap: "8px", // for use with <a>
                    justifyContent: "center", // for use with <a>
                    alignItems: "center", // for use with <a>
                    "&:hover": {
                        backgroundColor: "var(--step-200)",
                        borderColor: "var(--step-250)",
                    },
                    "&:active": {
                        backgroundColor: "var(--step-300)",
                        borderColor: "var(--step-350)",
                    },
                    "&:disabled": {
                        pointerEvents: "none",
                        opacity: "50%",
                    },
                },
                [name("btn-p")]: {
                    paddingLeft: options.itemRadius,
                    paddingRight: options.itemRadius,
                },
                [name("btn-tall")]: {
                    height: options.buttonHeight,
                },
                [name("btn-thin")]: {
                    height: options.buttonHeightThin,
                },
                [name("btn-transparent")]: {
                    backgroundColor: `transparent`,
                    borderColor: `transparent`,
                    "&:hover": {
                        backgroundColor: `var(--step-100)`,
                        borderColor: `var(--step-150)`,
                    },
                    "&:active": {
                        backgroundColor: `var(--step-300)`,
                        borderColor: `var(--step-350)`,
                    },
                },
                [name("btn-blue")]: btnColor("blue"),
                [name("btn-green")]: btnColor("green"),
                [name("btn-red")]: btnColor("red"),
                [name("btn-red")]: btnColor("red"),
                [name("btn-orange")]: btnColor("orange"),
                [name("link")]: {
                    color: "var(--blue-000)",
                    textUnderlineOffset: "2px", // for when `underline` is used
                    "&:hover": {
                        color: "var(--blue-100)",
                    },
                    "&:active": {
                        color: "var(--blue-200)",
                    },
                },
            })
        }
    },
    // eslint-disable-next-line no-unused-vars
    function (options = {}) {
        return {}
    },
)
