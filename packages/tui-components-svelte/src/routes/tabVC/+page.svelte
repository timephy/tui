<script lang="ts">
    import TabViewController, { type SelectTab } from "$lib/tabs/TabViewController.svelte"
    import Icon, { type IconType } from "$lib/ui/Icon.svelte"
    import gear_wide_connected from "@timephy/tui-icons-svelte/gear_wide_connected"
    import Home from "./Home.svelte"
    import Settings from "./Settings.svelte"
</script>

{#snippet item(label: string, icon: IconType, selected: boolean, select: SelectTab)}
    <button
        class="btn relative flex min-w-[5.5rem] flex-col items-center justify-center gap-1 p-1.5
            {selected ? 'text-blue' : 'text-step-700'}"
        onclick={select}
    >
        <!-- ! Icon -->
        <Icon data={icon} class="size-5" />
        <div class="flex items-center gap-1">
            <!-- ! Title -->
            <p class="text-xs">{label}</p>
        </div>
        <!-- ! data.selected Indicator Bar -->
        {#if selected}
            <div class="absolute bottom-0 h-[2px] w-8 rounded-t-full bg-blue/75"></div>
        {/if}
    </button>
{/snippet}

{#snippet itemHome(selected: boolean, select: SelectTab)}
    {@render item("Home", gear_wide_connected, selected, select)}
{/snippet}
{#snippet viewHome()}
    <Home />
{/snippet}

{#snippet itemSettings(selected: boolean, select: SelectTab)}
    {@render item("Settings", gear_wide_connected, selected, select)}
{/snippet}
{#snippet viewSettings()}
    <Settings />
{/snippet}

<TabViewController
    tabs={{
        home: {
            view: viewHome,
            item: itemHome,
        },
        settings: {
            view: viewSettings,
            item: itemSettings,
        },
    }}
    selected="settings"
    barClass="px-safe-or-2 my-2 h-[54px] gap-2"
    onSelected={(tabId) => console.log("onSelectVC", tabId)}
/>
