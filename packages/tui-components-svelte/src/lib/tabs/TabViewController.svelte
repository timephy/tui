<!--
    @component
    A TabViewController is a component that manages multiple tabs and their views.


    @example
    ```svelte
    <script lang="ts">
        import { TabViewController } from "@timui/tabs"
        import type { TabDef } from "@timui/tabs"
        import Tab1 from "./Tab1.svelte"
        import Tab2 from "./Tab2.svelte"
        import Tab3 from "./Tab3.svelte"

        const tabs: Record<string, TabDef> = { // this could be `$derived({ ... })`
            tab1: {
                item: tab1Item,
                view: tab1View,
            },
            tab2: {
                item: tab2Item,
                view: tab2View,
            },
        }
        let selected: keyof typeof tabs = $state("tab1")

        function onSelected(tabId: string) {
            console.log(`Selected tab: ${tabId}`)
        }
    </script>

    <TabViewController {tabs} {selected} {onSelected} />
    ```

    And then inside a tab view:

    ```svelte
    <script lang="ts">
        import { getTab } from "@timui/tabs"

        const TAB = getTab()

        let i = $state(0)

        tab.onSelected(() => {
            console.log("onSelect")
            i++
        })
    </script>
    ```
-->

<script lang="ts" module>
    import { untrack } from "svelte"
    import type { TabDef } from "."
    import TabView from "./TabView.svelte"

    export type SelectTab = () => void
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
        {#each Object.entries(tabs) as [tabId, tab] (tabId)}
            <TabView selected={tabId === selected}>
                {@render tab.view()}
            </TabView>
        {/each}
    </div>

    <div id="TabBar" class="w-full border-t border-step-050 bg-step-000" style:display={barHidden ? "none" : ""}>
        <div id="TabBarContent" class="flex items-center justify-center {barClass}">
            {#each Object.entries(tabs) as [tabId, tab] (tabId)}
                {@render tab.item(tabId === selected, () => (selected = tabId))}
            {/each}
        </div>
    </div>
</div>
