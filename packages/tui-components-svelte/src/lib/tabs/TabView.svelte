<!--
    @component
    Represents a single Tab's View, it is the container that the tab view is rendered in.

    - It controls the visibility of the tab view based on the `selected` prop.
    - It provides a context to its children to allow them to interact with the tab.
-->

<script lang="ts">
    import { setContext, untrack, type Snippet } from "svelte"
    import type { Tab } from "."
    import { TAB_KEY, type Fn } from "./internal"

    /* ============================================================================================================== */

    const {
        selected,
        children,
    }: {
        selected: boolean
        children: Snippet
    } = $props()

    /* ============================================================================================================== */

    const TAB: Tab = {
        get selected() {
            return selected
        },
        onSelected(cb: Fn) {
            $effect.pre(() => {
                if (selected) {
                    untrack(cb)
                }
            })
        },
    }
    setContext(TAB_KEY, TAB)
</script>

<div id="TabView" class="h-full w-full overflow-auto overscroll-contain" style:display={selected ? "" : "none"}>
    {@render children()}
</div>
