import { browser } from "$app/environment"
import { onDestroy, untrack } from "svelte"

export type Opts<T> = {
    construct: (curr?: T) => T
    destruct?: (curr: T) => void
    /**
     * Whether to run the effect on the component or module level.
     *
     * - `component`: The effect will be run on the component level.
     * - `module`: The effect will be run on the module level.
     *
     * Also detects if running on the server or client.
     *
     * - `server`: The effect will be run on the server.
     * - `client`: The effect will be run on the client.
     */
    mode?: "component" | "module"
}

export type DerivedStateType<T> = (() => T) & {
    readonly value: T
    /** A cleanup function that is available in `mode === "module"`. */
    cleanup?(): void
}

/**
 * This is a helper function to create derived state, state always exists.
 *
 * Use this inside `⁠$derived.by(...)`.
 */
export function DerivedState<T>(opts: Opts<T>): DerivedStateType<T> {
    let curr: T = $state()!

    if (browser) {
        console.log("browser")
        // NOTE: This constructs and recreates the value on the client-side
        const _effect_pre = () => {
            $effect.pre(() => {
                console.log(
                    "$effect.pre",
                    untrack(() => curr),
                )
                curr = opts.construct(untrack(() => curr))
                return () => opts.destruct?.(curr)
            })
        }

        let cleanup: (() => void) | undefined
        if (opts.mode === "module") {
            console.log("module")
            cleanup = $effect.root(_effect_pre)
        } else {
            console.log("component")
            _effect_pre()
        }

        const inner = () => curr
        return Object.assign(inner, {
            get value() {
                return inner()
            },
            cleanup,
        })
    } else {
        console.log("server")
        // NOTE: This constructs the value LAZILY, because we can not update it directly, since `$effect`s don't run on the server
        const inner = () => {
            opts.destruct?.(curr)
            curr = opts.construct(curr)
            return curr
        }
        return Object.assign(inner, {
            get value() {
                return inner()
            },
        })
    }
}
