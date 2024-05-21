const color_definitions = {
    light: {
        "step-base": "246, 246, 246",
        "step-000": "255, 255, 255",
        "step-050": "242, 242, 242",
        "step-100": "230, 230, 230",
        "step-150": "218, 218, 218",
        "step-200": "205, 205, 205",
        "step-250": "192, 192, 192",
        "step-300": "180, 180, 180",
        "step-350": "168, 168, 168",
        "step-400": "155, 155, 155",
        "step-450": "105, 105, 105",
        "step-500": "96, 96, 96",
        "step-550": "87, 87, 87",
        "step-600": "78, 78, 78",
        "step-650": "69, 69, 69",
        "step-700": "59, 59, 59",
        "step-750": "50, 50, 50",
        "step-800": "41, 41, 41",
        "step-850": "32, 32, 32",
        "step-900": "23, 23, 23",
        "red-000": "249, 51, 70",
        "red-050": "248, 29, 50",
        "red-100": "248, 22, 44",
        "red-150": "240, 7, 29",
        "red-200": "219, 6, 27",
        "red-250": "197, 6, 24",
        "orange-000": "255, 88, 4",
        "orange-050": "240, 80, 0",
        "orange-100": "234, 78, 0",
        "orange-150": "214, 72, 0",
        "orange-200": "195, 65, 0",
        "orange-250": "175, 59, 0",
        "yellow-000": "219, 121, 0",
        "yellow-050": "203, 112, 0",
        "yellow-100": "197, 109, 0",
        "yellow-150": "181, 100, 0",
        "yellow-200": "164, 91, 0",
        "yellow-250": "148, 82, 0",
        "green-000": "0, 168, 36",
        "green-050": "0, 155, 33",
        "green-100": "0, 151, 32",
        "green-150": "0, 139, 30",
        "green-200": "0, 126, 27",
        "green-250": "0, 113, 24",
        "mint-000": "16, 176, 169",
        "mint-050": "15, 163, 156",
        "mint-100": "14, 158, 152",
        "mint-150": "13, 145, 139",
        "mint-200": "12, 132, 127",
        "mint-250": "11, 119, 114",
        "teal-000": "0, 178, 210",
        "teal-050": "0, 165, 194",
        "teal-100": "0, 160, 189",
        "teal-150": "0, 147, 173",
        "teal-200": "0, 133, 158",
        "teal-250": "0, 120, 142",
        "cyan-000": "0, 154, 225",
        "cyan-050": "0, 142, 208",
        "cyan-100": "0, 139, 202",
        "cyan-150": "0, 127, 186",
        "cyan-200": "0, 116, 169",
        "cyan-250": "0, 104, 152",
        "blue-000": "77, 128, 255",
        "blue-050": "52, 111, 255",
        "blue-100": "43, 105, 255",
        "blue-150": "18, 87, 255",
        "blue-200": "0, 72, 249",
        "blue-250": "0, 65, 224",
        "indigo-000": "115, 113, 210",
        "indigo-050": "97, 94, 204",
        "indigo-100": "90, 88, 202",
        "indigo-150": "72, 70, 196",
        "indigo-200": "61, 58, 184",
        "indigo-250": "55, 52, 165",
        "purple-000": "213, 148, 212",
        "purple-050": "205, 129, 204",
        "purple-100": "203, 122, 202",
        "purple-150": "195, 103, 194",
        "purple-200": "188, 83, 186",
        "purple-250": "175, 69, 174",
        "pink-000": "240, 74, 106",
        "pink-050": "238, 52, 88",
        "pink-100": "238, 45, 82",
        "pink-150": "236, 23, 64",
        "pink-200": "217, 18, 56",
        "pink-250": "195, 16, 51",
        "brown-000": "174, 139, 93",
        "brown-050": "165, 129, 82",
        "brown-100": "160, 126, 80",
        "brown-150": "147, 115, 73",
        "brown-200": "134, 105, 67",
        "brown-250": "120, 94, 60",
        "gray-000": "146, 146, 151",
        "gray-050": "135, 135, 140",
        "gray-100": "131, 131, 136",
        "gray-150": "120, 120, 125",
        "gray-200": "109, 109, 114",
        "gray-250": "98, 98, 103",
    },
    dark: {
        "step-base": "15, 15, 15",
        "step-000": "23, 23, 23",
        "step-050": "32, 32, 32",
        "step-100": "41, 41, 41",
        "step-150": "50, 50, 50",
        "step-200": "59, 59, 59",
        "step-250": "69, 69, 69",
        "step-300": "78, 78, 78",
        "step-350": "87, 87, 87",
        "step-400": "96, 96, 96",
        "step-450": "105, 105, 105",
        "step-500": "155, 155, 155",
        "step-550": "168, 168, 168",
        "step-600": "180, 180, 180",
        "step-650": "192, 192, 192",
        "step-700": "205, 205, 205",
        "step-750": "218, 218, 218",
        "step-800": "230, 230, 230",
        "step-850": "242, 242, 242",
        "step-900": "255, 255, 255",
        "red-000": "230, 44, 33",
        "red-050": "232, 60, 50",
        "red-100": "233, 66, 56",
        "red-150": "235, 83, 74",
        "red-200": "237, 100, 92",
        "red-250": "239, 117, 109",
        "orange-000": "231, 155, 40",
        "orange-050": "233, 164, 58",
        "orange-100": "234, 166, 65",
        "orange-150": "236, 175, 83",
        "orange-200": "238, 183, 101",
        "orange-250": "240, 192, 119",
        "yellow-000": "224, 185, 25",
        "yellow-050": "231, 193, 37",
        "yellow-100": "231, 194, 43",
        "yellow-150": "233, 199, 59",
        "yellow-200": "235, 204, 76",
        "yellow-250": "237, 209, 93",
        "green-000": "48, 182, 69",
        "green-050": "52, 196, 74",
        "green-100": "53, 201, 76",
        "green-150": "66, 205, 87",
        "green-200": "79, 209, 100",
        "green-250": "93, 212, 112",
        "mint-000": "79, 188, 183",
        "mint-050": "93, 193, 189",
        "mint-100": "98, 195, 191",
        "mint-150": "113, 201, 197",
        "mint-200": "127, 206, 203",
        "mint-250": "142, 212, 209",
        "teal-000": "62, 207, 234",
        "teal-050": "82, 212, 236",
        "teal-100": "88, 214, 237",
        "teal-150": "109, 219, 239",
        "teal-200": "129, 224, 241",
        "teal-250": "149, 229, 243",
        "cyan-000": "77, 191, 235",
        "cyan-050": "98, 199, 237",
        "cyan-100": "105, 201, 238",
        "cyan-150": "126, 209, 241",
        "cyan-200": "147, 216, 243",
        "cyan-250": "168, 224, 245",
        "blue-000": "40, 132, 231",
        "blue-050": "58, 143, 233",
        "blue-100": "65, 146, 234",
        "blue-150": "83, 156, 236",
        "blue-200": "101, 167, 238",
        "blue-250": "119, 177, 240",
        "indigo-000": "88, 84, 236",
        "indigo-050": "110, 106, 238",
        "indigo-100": "117, 113, 239",
        "indigo-150": "138, 135, 242",
        "indigo-200": "159, 157, 244",
        "indigo-250": "180, 178, 246",
        "purple-000": "192, 100, 238",
        "purple-050": "201, 123, 241",
        "purple-100": "205, 131, 241",
        "purple-150": "214, 154, 244",
        "purple-200": "223, 176, 246",
        "purple-250": "232, 199, 249",
        "pink-000": "231, 35, 72",
        "pink-050": "233, 53, 87",
        "pink-100": "234, 59, 92",
        "pink-150": "236, 77, 107",
        "pink-200": "238, 95, 122",
        "pink-250": "240, 113, 137",
        "brown-000": "154, 126, 89",
        "brown-050": "164, 135, 97",
        "brown-100": "167, 138, 101",
        "brown-150": "173, 146, 112",
        "brown-200": "180, 155, 124",
        "brown-250": "186, 164, 136",
        "gray-000": "129, 129, 134",
        "gray-050": "139, 139, 143",
        "gray-100": "142, 142, 147",
        "gray-150": "152, 152, 156",
        "gray-200": "162, 162, 166",
        "gray-250": "172, 172, 176",
    },
}

// assertions
if (Object.keys(color_definitions.light).length !== Object.keys(color_definitions.dark).length) {
    console.error("Color definitions don't have equal length")
}

if (
    Object.keys(color_definitions.light).some(
        (key) => !Object.keys(color_definitions.dark).includes(key),
    )
) {
    console.error("Color definitions don't have the same keys")
}
if (
    Object.keys(color_definitions.dark).some(
        (key) => !Object.keys(color_definitions.light).includes(key),
    )
) {
    console.error("Color definitions don't have the same keys")
}

/* ============================================================================================== */

const colors_css_values = {
    light: Object.fromEntries(
        Object.entries(color_definitions.light).map(([color, value]) => [
            `--${color}-light-value`,
            `${value}`,
        ]),
    ),
    dark: Object.fromEntries(
        Object.entries(color_definitions.dark).map(([color, value]) => [
            `--${color}-dark-value`,
            `${value}`,
        ]),
    ),
}

const colors_css_values_mode = {
    light: Object.fromEntries(
        Object.keys(color_definitions.light).map((color) => [
            `--${color}-value`,
            `var(--${color}-light-value)`,
        ]),
    ),
    dark: Object.fromEntries(
        Object.keys(color_definitions.dark).map((color) => [
            `--${color}-value`,
            `var(--${color}-dark-value)`,
        ]),
    ),
}

const colors_css = {
    light: Object.fromEntries(
        Object.keys(color_definitions.light).map((color) => [
            `--${color}-light`,
            `rgb(var(--${color}-light-value))`,
        ]),
    ),
    dark: Object.fromEntries(
        Object.keys(color_definitions.dark).map((color) => [
            `--${color}-dark`,
            `rgb(var(--${color}-dark-value))`,
        ]),
    ),
}

const colors_css_mode = {
    light: Object.fromEntries(
        Object.keys(color_definitions.light).map((color) => [
            `--${color}`,
            `var(--${color}-light)`,
        ]),
    ),
    dark: Object.fromEntries(
        Object.keys(color_definitions.dark).map((color) => [`--${color}`, `var(--${color}-dark)`]),
    ),
}

export const colors_tailwind = {
    ...Object.fromEntries(
        Object.keys(color_definitions.light).map((color) => [
            `${color}-light`,
            `rgb(var(--${color}-light-value), <alpha-value>)`,
        ]),
    ),
    ...Object.fromEntries(
        Object.keys(color_definitions.dark).map((color) => [
            `${color}-dark`,
            `rgb(var(--${color}-dark-value), <alpha-value>)`,
        ]),
    ),
    ...Object.fromEntries(
        Object.keys(color_definitions.dark).map((color) => [
            `${color}`,
            `rgb(var(--${color}-value), <alpha-value>)`,
        ]),
    ),
}

/* ============================================================================================== */

export default function ({ config, addBase }) {
    const { darkMode } = config()

    if (!["media", "class"].includes(darkMode)) {
        throw "darkMode must be either 'media' or 'class'"
    }

    addBase({
        html: {
            ...colors_css_values.light,
            ...colors_css_values.dark,
            ...colors_css_values_mode.light,
            //
            ...colors_css.light,
            ...colors_css.dark,
            ...colors_css_mode.light,
            //
            [darkMode === "class" ? ".dark" : "@media (prefers-color-scheme: dark)"]: {
                ...colors_css_values_mode.dark,
                //
                ...colors_css_mode.dark,
            },
        },
    })
}
