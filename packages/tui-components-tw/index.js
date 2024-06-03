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
        color: "#ffffff",
        backgroundColor: `rgb(var(--${color}-000-value), var(--tw-bg-opacity))`,
        borderColor: `rgb(var(--${color}-050-value), var(--tw-border-opacity))`,
        "&:hover": {
            backgroundColor: `rgb(var(--${color}-100-value), var(--tw-bg-opacity))`,
            borderColor: `rgb(var(--${color}-150-value), var(--tw-border-opacity))`,
        },
        "&:active": {
            backgroundColor: `rgb(var(--${color}-200-value), var(--tw-bg-opacity))`,
            borderColor: `rgb(var(--${color}-250-value), var(--tw-border-opacity))`,
        },
    }
}

export default plugin.withOptions(
    function (options = {}) {
        options = { ...defaults, ...options }
        const name = (name) => `.${options.prefix}${name}`

        // eslint-disable-next-line no-unused-vars
        return function ({ theme, addBase, addComponents, addUtilities }) {
            addBase({
                html: {
                    "--border-width": options.borderWidth,
                    "--tw-border-opacity": "1",
                },
                hr: {
                    color: "var(--step-100)",
                },
            })

            addComponents({
                [name("card")]: {
                    backgroundColor: "rgb(var(--step-000-value), var(--tw-bg-opacity))",
                    borderRadius: options.cardRadius,
                    borderWidth: "var(--border-width)",
                    borderColor: "rgb(var(--step-050-value), var(--tw-border-opacity))",
                },
                [name("card-p")]: {
                    padding: `calc(${options.cardRadius} - ${options.itemRadius})`,
                },
                [name("item")]: {
                    backgroundColor: "rgb(var(--step-050-value), var(--tw-bg-opacity))",
                    borderRadius: options.itemRadius,
                    borderWidth: "var(--border-width)",
                    borderColor: "rgb(var(--step-100-value), var(--tw-border-opacity))",
                },
                [name("item-p")]: {
                    padding: options.itemRadius,
                },
                [name("btn")]: {
                    backgroundColor: "rgb(var(--step-100-value), var(--tw-bg-opacity))",
                    borderRadius: options.itemRadius,
                    borderWidth: "var(--border-width)",
                    borderColor: "rgb(var(--step-150-value), var(--tw-border-opacity))",
                    "&:hover": {
                        backgroundColor: "rgb(var(--step-200-value), var(--tw-bg-opacity))",
                        borderColor: "rgb(var(--step-250-value), var(--tw-border-opacity))",
                    },
                    "&:active": {
                        backgroundColor: "rgb(var(--step-300-value), var(--tw-bg-opacity))",
                        borderColor: "rgb(var(--step-350-value), var(--tw-border-opacity))",
                    },
                    "&:disabled": {
                        pointerEvents: "none",
                        opacity: "50%",
                    },
                    userSelect: "none",
                    // default to flex centering (text is centered in <button> by default, but not in <a>)
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    "&:focus-visible": {
                        outlineStyle: "solid",
                        outlineWidth: "2px",
                        outlineColor: "var(--blue-000)",
                    },
                },
                [name("btn-p")]: {
                    paddingLeft: "1rem",
                    paddingRight: "1rem",
                },
                [name("btn-tall")]: {
                    "min-height": options.buttonHeight,
                },
                [name("btn-thin")]: {
                    "min-height": options.buttonHeightThin,
                },
                [name("btn-transparent")]: {
                    backgroundColor: `transparent`,
                    borderColor: `transparent`,
                    "&:hover": {
                        backgroundColor: `rgb(var(--step-100-value), var(--tw-bg-opacity))`,
                        borderColor: `rgb(var(--step-150-value), var(--tw-border-opacity))`,
                    },
                    "&:active": {
                        backgroundColor: `rgb(var(--step-300-value), var(--tw-bg-opacity))`,
                        borderColor: `rgb(var(--step-350-value), var(--tw-border-opacity))`,
                    },
                },
                [name("btn-gray")]: {
                    color: "unset",
                    backgroundColor: "rgb(var(--step-100-value), var(--tw-bg-opacity))",
                    borderColor: "rgb(var(--step-150-value), var(--tw-border-opacity))",
                    "&:hover": {
                        backgroundColor: "rgb(var(--step-200-value), var(--tw-bg-opacity))",
                        borderColor: "rgb(var(--step-250-value), var(--tw-border-opacity))",
                    },
                    "&:active": {
                        backgroundColor: "rgb(var(--step-300-value), var(--tw-bg-opacity))",
                        borderColor: "rgb(var(--step-350-value), var(--tw-border-opacity))",
                    },
                },
                [name("btn-blue")]: btnColor("blue"),
                [name("btn-green")]: btnColor("green"),
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

            addUtilities({})
        }
    },
    // eslint-disable-next-line no-unused-vars
    function (options = {}) {
        return {}
    },
)
