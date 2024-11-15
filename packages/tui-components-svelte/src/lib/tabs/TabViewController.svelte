<!--
    @component
    A TabViewController is a component that manages multiple tabs and their views.

    - It displays the views of the tabs based on the selected tab.
    - It makes the view scrollable, so that the tab bar is always visible.
    - It provides a tab bar to switch between tabs.

    ## Layout

    - The TabViewController is `h-full w-full` and `flex-col`.
    - The TabContent is `grow overflow-auto overscroll-contain`.
    - The TabBar is `flex items-center justify-center` and has `bg` and `border-t`.
        - You should apply `barClass="px- py- gap-"` yourself.
-->

<script lang="ts" module>
    import { untrack, type Snippet } from "svelte"
    import TabView from "./TabView.svelte"

    export type SelectTab = () => void

    export type TabDef = {
        item: Snippet<[boolean, SelectTab]>
        view: Snippet
    }
</script>

<script lang="ts" generics="Tabs extends Record<string, TabDef>">
    let {
        tabs,
        selected = $bindable(),

        barHidden = false,
        barClass,

        onSelected,
    }: {
        tabs: Tabs
        selected: keyof typeof tabs

        barHidden?: boolean
        barClass?: string

        /**
         * Callback that runs when a new tab is selected.
         *
         * - Will always run before the `onSelected` inside `TabView`, use this for general "cleanup" of tabs.
         * - Will not run on the server.
         */
        onSelected?: (tabId: typeof selected) => void
    } = $props()

    /* ============================================================================================================== */

    // NOTE: This will always fire before the `onSelect` inside `TabView`
    $effect.pre(() => {
        const _selected = selected
        untrack(() => onSelected?.(_selected))
    })
</script>

<div id="TabViewController" class="flex h-full w-full flex-col">
    <!-- NOTE: Without `h-0` the correct height is not set (required for scrolling container) -->
    <div id="TabContent" class="h-0 w-full grow">
        {#each Object.entries(tabs) as [tabId, tab]}
            <TabView selected={tabId === selected}>
                {@render tab.view()}
            </TabView>
        {/each}
    </div>

    <div id="TabBar" class="w-full border-t border-step-050 bg-step-000" style:display={barHidden ? "none" : ""}>
        <div id="TabBarContent" class="flex items-center justify-center {barClass}">
            {#each Object.entries(tabs) as [tabId, tab]}
                {@render tab.item(tabId === selected, () => (selected = tabId))}
            {/each}
        </div>
    </div>
</div>
