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
    sectionPaddingX: "6px",
}

const btnColor = (color) => {
    return {
        color: "#ffffff",
        backgroundColor: `rgb(var(--${color}-000-value), var(--tw-bg-opacity))`,
        borderColor: `rgb(var(--${color}-050-value), var(--tw-border-opacity))`,
        "@media (hover: hover) and (pointer: fine)": {
            "&:hover": {
                backgroundColor: `rgb(var(--${color}-100-value), var(--tw-bg-opacity))`,
                borderColor: `rgb(var(--${color}-150-value), var(--tw-border-opacity))`,
            },
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
        const componentName = (name) => `.${options.prefix}${name}`

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
                [componentName("card")]: {
                    backgroundColor: "rgb(var(--step-000-value), var(--tw-bg-opacity))",
                    borderRadius: options.cardRadius,
                    borderWidth: "var(--border-width)",
                    borderColor: "rgb(var(--step-050-value), var(--tw-border-opacity))",
                },
                [componentName("card-p")]: {
                    padding: `calc(${options.cardRadius} - ${options.itemRadius})`,
                },
                [componentName("item")]: {
                    backgroundColor: "rgb(var(--step-050-value), var(--tw-bg-opacity))",
                    borderRadius: options.itemRadius,
                    borderWidth: "var(--border-width)",
                    borderColor: "rgb(var(--step-100-value), var(--tw-border-opacity))",
                },
                [componentName("item-p")]: {
                    padding: options.itemRadius,
                },
                [componentName("btn")]: {
                    backgroundColor: "rgb(var(--step-100-value), var(--tw-bg-opacity))",
                    borderRadius: options.itemRadius,
                    borderWidth: "var(--border-width)",
                    borderColor: "rgb(var(--step-150-value), var(--tw-border-opacity))",
                    "@media (hover: hover) and (pointer: fine)": {
                        "&:hover": {
                            backgroundColor: "rgb(var(--step-200-value), var(--tw-bg-opacity))",
                            borderColor: "rgb(var(--step-250-value), var(--tw-border-opacity))",
                        },
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
                [componentName("btn-p")]: {
                    paddingLeft: "1rem",
                    paddingRight: "1rem",
                },
                [componentName("btn-tall")]: {
                    "min-height": options.buttonHeight,
                },
                [componentName("btn-thin")]: {
                    "min-height": options.buttonHeightThin,
                },
                [componentName("btn-transparent")]: {
                    backgroundColor: `transparent`,
                    borderColor: `transparent`,
                    "@media (hover: hover) and (pointer: fine)": {
                        "&:hover": {
                            backgroundColor: `rgb(var(--step-100-value), var(--tw-bg-opacity))`,
                            borderColor: `rgb(var(--step-150-value), var(--tw-border-opacity))`,
                        },
                    },
                    "&:active": {
                        backgroundColor: `rgb(var(--step-300-value), var(--tw-bg-opacity))`,
                        borderColor: `rgb(var(--step-350-value), var(--tw-border-opacity))`,
                    },
                },
                [componentName("btn-gray")]: {
                    color: "unset",
                    backgroundColor: "rgb(var(--step-100-value), var(--tw-bg-opacity))",
                    borderColor: "rgb(var(--step-150-value), var(--tw-border-opacity))",
                    "@media (hover: hover) and (pointer: fine)": {
                        "&:hover": {
                            backgroundColor: "rgb(var(--step-200-value), var(--tw-bg-opacity))",
                            borderColor: "rgb(var(--step-250-value), var(--tw-border-opacity))",
                        },
                    },
                    "&:active": {
                        backgroundColor: "rgb(var(--step-300-value), var(--tw-bg-opacity))",
                        borderColor: "rgb(var(--step-350-value), var(--tw-border-opacity))",
                    },
                },
                [componentName("btn-blue")]: btnColor("blue"),
                [componentName("btn-green")]: btnColor("green"),
                [componentName("btn-red")]: btnColor("red"),
                [componentName("btn-orange")]: btnColor("orange"),
                [componentName("link")]: {
                    color: "var(--blue-000)",
                    textUnderlineOffset: "2px", // for when `underline` is used
                    "@media (hover: hover) and (pointer: fine)": {
                        "&:hover": {
                            color: "var(--blue-100)",
                        },
                    },
                    "&:active": {
                        color: "var(--blue-200)",
                    },
                },
                [componentName("note")]: {
                    color: "var(--step-500)",
                    fontSize: "12px",
                    lineHeight: "1rem",
                },
                [componentName("section")]: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    "&>p,&>span,&>h1,&>h2,&>h3,&>h4,&>h5,&>h6": {
                        paddingLeft: options.sectionPaddingX,
                        paddingRight: options.sectionPaddingX,
                    },
                    "&>hr": {
                        marginTop: "16px",
                        marginBottom: "16px",
                        marginLeft: options.sectionPaddingX,
                        marginRight: options.sectionPaddingX,
                    },
                    "&>h1": {
                        fontSize: theme("fontSize.xl"),
                        fontWeight: theme("fontWeight.semibold"),
                    },
                    "&>h2": {
                        fontSize: theme("fontSize.lg"),
                        fontWeight: theme("fontWeight.medium"),
                    },
                    "&>h3": {
                        fontSize: theme("fontSize.base"),
                        fontWeight: theme("fontWeight.medium"),
                    },
                    "&>p": {
                        // COPY OF `note`
                        color: "var(--step-500)",
                        fontSize: "12px",
                        lineHeight: "1rem",
                    },
                },
            })

            addUtilities({
                ".px-section": {
                    paddingLeft: options.sectionPaddingX,
                    paddingRight: options.sectionPaddingX,
                },
                ".pl-section": {
                    paddingLeft: options.sectionPaddingX,
                },
                ".pr-section": {
                    paddingRight: options.sectionPaddingX,
                },
            })
        }
    },

    function (options = {}) {
        return {}
    },
)
