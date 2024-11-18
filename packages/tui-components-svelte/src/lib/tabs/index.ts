import { getContext, type Snippet } from "svelte"
import { TAB_KEY, type Fn } from "./internal"

export type TabDef = {
    item: Snippet<[boolean, Fn]>
    view: Snippet
}

export type Tab = {
    /** Whether the tab is selected. */
    selected: boolean
    /**
     * Register a callback to run when this tab is selected.
     *
     * - Will always run after `onSelected` inside `TabViewController`.
     * - Will not run on the server.
     */
    onSelected(cb: Fn): void
}

/**
 * Call this function from a child of `TabView` to get the TabContext.
 */
export function getTab() {
    const context = getContext(TAB_KEY)
    if (context === undefined) throw new Error("No TabContext found")
    return context as Tab
}
