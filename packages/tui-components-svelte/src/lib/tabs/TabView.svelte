<!--
    @component
    Represents a single Tab's View, it is the container that the tab view is rendered in.

    - It controls the visibility of the tab view based on the `selected` prop.
    - It provides a context to its children to allow them to interact with the tab.
-->

<script lang="ts" module>
    export type OnSelectTab = () => void

    const TAB_CONTEXT = "tui.tab"
    export type TabContext = {
        /** Whether the tab is selected. */
        selected: boolean
        /**
         * Register a callback to run when this tab is selected.
         *
         * - Will always run after `onSelected` inside `TabViewController`.
         * - Will not run on the server.
         */
        onSelected(cb: OnSelectTab): void
    }

    /**
     * Call this function from a child of `TabView` to get the TabContext.
     */
    export function getTabContext() {
        const context = getContext(TAB_CONTEXT)
        if (context === undefined) throw new Error("No TabContext found")
        return context as TabContext
    }
</script>

<script lang="ts">
    import { getContext, setContext, untrack, type Snippet } from "svelte"

    /* ============================================================================================================== */

    const {
        selected,
        children,
    }: {
        selected: boolean
        children: Snippet
    } = $props()

    /* ============================================================================================================== */

    const context: TabContext = {
        get selected() {
            return selected
        },
        onSelected(cb: OnSelectTab) {
            $effect.pre(() => {
                if (selected) {
                    untrack(cb)
                }
            })
        },
    }
    setContext(TAB_CONTEXT, context)
</script>

<div id="TabView" class="h-full w-full overflow-auto overscroll-contain" style:display={selected ? "" : "none"}>
    {@render children()}
</div>
