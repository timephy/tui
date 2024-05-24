import js from "@eslint/js"
import typescriptPlugin from "@typescript-eslint/eslint-plugin"
import typescriptParser from "@typescript-eslint/parser"
import sveltePlugin from "eslint-plugin-svelte"
import globals from "globals"
import svelteParser from "svelte-eslint-parser"

export default [
    {
        ignores: ["**/.svelte-kit/**/*", "**/dist/**/*", "**/build"],
        languageOptions: {
            globals: globals.browser,
        },
    },

    // Load predefined config
    js.configs.recommended,

    // JavaScript
    {
        files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    },

    // TypeScript
    {
        files: ["**/*.ts"],
        ignores: ["**/.svelte-kit/**/*", "**/dist/**/*", "**/build"],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                project: "./tsconfig.json",
                extraFileExtensions: [".svelte"],
            },
        },
        plugins: {
            "@typescript-eslint": typescriptPlugin,
        },
        rules: {
            ...typescriptPlugin.configs.recommended.rules,
        },
    },

    // Svelte
    {
        files: ["**/*.svelte"],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: typescriptParser,
                project: "./tsconfig.json",
                extraFileExtensions: [".svelte"],
            },
        },
        plugins: {
            svelte: sveltePlugin,
            "@typescript-eslint": typescriptPlugin,
        },
        rules: {
            ...typescriptPlugin.configs.recommended.rules,
            ...sveltePlugin.configs.recommended.rules,
        },
    },
]
