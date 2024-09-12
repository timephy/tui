import js from "@eslint/js"
import ts from "typescript-eslint"
import svelte from "eslint-plugin-svelte"
import prettier from "eslint-config-prettier"
import globals from "globals/index.js"

/** @type {import('eslint').Linter.Config[]} */
export default [
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs["flat/recommended"],
    prettier,
    ...svelte.configs["flat/prettier"],
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                // these two RTC types are missing from "globals", but are present in TypeScript lib "dom"
                RTCIceCandidateInit: false,
                RTCSessionDescriptionInit: false,
            },
        },
    },
    {
        files: ["**/*.svelte"],
        languageOptions: {
            parserOptions: {
                parser: ts.parser,
                svelteFeatures: {
                    experimentalGenerics: true,
                },
            },
        },
    },
    {
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-unused-expressions": "warn",
            "svelte/valid-compile": [
                "error",
                {
                    ignoreWarnings: true,
                },
            ],
        },
    },
    {
        ignores: ["**/build/", "**/dist/", "**/.svelte-kit/"],
    },
]
