import assert from "node:assert"
import fs from "node:fs"
import { parse } from "svg-parser"

// path depends on package manager, but pnpm installs local in package
const SOURCE_DIR = "./node_modules/bootstrap-icons/icons"
const TARGET_DIR = "src/icons"

// skip these files because they contain unsupported elements (`rect`)
const SKIP_FILES = ["align-top.svg", "align-bottom.svg"]

// // clear target dir
// for (const file of fs.readdirSync(TARGET_DIR)) {
//     // print(file)
//     if (file.startsWith(".")) continue
//     fs.rmSync(`${TARGET_DIR}/${file}`)
// }

// read source dir
for (const file of fs.readdirSync(SOURCE_DIR)) {
    if (SKIP_FILES.includes(file)) continue

    const content = fs.readFileSync(`${SOURCE_DIR}/${file}`, "utf-8")
    const svg = parse(content)

    assert(svg.children.length === 1)
    const root = svg.children[0]

    assert(root.type === "element")
    assert(root.tagName === "svg")

    const { width, height } = root.properties ?? {}
    assert(width === 16)
    assert(height === 16)

    const _paths = root.children
    const paths = _paths.map((path) => {
        // print(file, path)

        assert(typeof path !== "string")
        assert(path.type === "element")
        assert(path.tagName === "path" || path.tagName === "circle")

        if (path.tagName === "path") {
            return {
                d: path.properties?.d,
                "fill-rule": path.properties?.["fill-rule"],
            }
        } else if (path.tagName === "circle") {
            assert(typeof path.properties?.cx === "number")
            assert(typeof path.properties?.cy === "number")
            assert(typeof path.properties?.r === "number")
            return {
                d: "M (CX - R), CY a R,R 0 1,0 (R * 2),0 a R,R 0 1,0 -(R * 2),0"
                    .replaceAll("(CX - R)", (path.properties.cx - path.properties.r).toString())
                    .replaceAll("(R * 2)", (path.properties.r * 2).toString())
                    .replaceAll("CX", path.properties.cx.toString())
                    .replaceAll("CY", path.properties.cy.toString())
                    .replaceAll("R", path.properties.r.toString()),
                "fill-rule": path.properties?.["fill-rule"],
            }
        }
    })

    const varname = slug_from_filename(file)
    const output = `
const ${varname} = {
    _: {
        width: ${width},
        height: ${height},
        paths: ${JSON.stringify(paths, null, 4).replaceAll("\n", "\n        ")},
    },
}
export default ${varname}
    `.trim()
    const filename = slug_from_filename(file) + ".ts"
    fs.writeFileSync(`${TARGET_DIR}/${filename}`, output)
}

/* ============================================================================================== */

function slug_from_filename(name: string): string {
    const slug = name.replaceAll("-", "_").replace(".svg", "")
    if (slug.match(/^\d/)) {
        return "n" + slug
    } else {
        return slug
    }
}

const ICONS = fs
    .readdirSync(TARGET_DIR)
    .filter((file) => file.endsWith(".ts"))
    .map((file) => file.replace(".ts", ""))
    .sort() // sort alphabetically

// ! ICONS -> icons/index.ts
const output = ICONS.map((name) => `export { default as ${name} } from "./${name}.js"`).join("\n")
fs.writeFileSync(`src/icons/index.ts`, output)

// ! Update `package.json > exports`
/** The `exports` mapping */
const exports = {
    "./ICONS": "./dist/icons/index.js",
    ...Object.fromEntries(ICONS.map((name) => [`./${name}`, `./dist/icons/${name}.js`])),
}

const pck = JSON.parse(fs.readFileSync("package.json").toString())
pck.exports = exports
// NOTE: End file with newline
fs.writeFileSync("package.json", JSON.stringify(pck, null, 4) + "\n")
