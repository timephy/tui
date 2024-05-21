import assert from "assert"
import fs from "fs"
import { parse } from "svg-parser"

const SOURCE_DIR = "../node_modules/bootstrap-icons/icons"
const TARGET_DIR = "icons"

// skip these files because they contain unsupported elements (`rect`)
const SKIP_FILES = ["align-top.svg", "align-bottom.svg"]

// clear target dir
for (const file of fs.readdirSync(TARGET_DIR)) {
    // print(file)
    if (file.startsWith(".")) continue
    fs.rmSync(`${TARGET_DIR}/${file}`)
}

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

    const output = `
export default {
    _: {
        width: ${width},
        height: ${height},
        paths: ${JSON.stringify(paths, null, 4).replaceAll("\n", "\n        ")},
    },
}
    `.trim()
    fs.writeFileSync(`${TARGET_DIR}/${file.replace(".svg", ".ts")}`, output)
}

// index.ts
function slug(name: string): string {
    const slug = name.replaceAll("-", "_")
    if (slug.match(/^\d/)) {
        return "n" + slug
    } else {
        return slug
    }
}

const output = fs
    .readdirSync(TARGET_DIR)
    .map((file) => file.replace(".ts", ""))
    .map((name) => `export { default as ${slug(name)} } from "./${name}"`)
    .join("\n")
fs.writeFileSync(`${TARGET_DIR}/index.ts`, output)
