<script lang="ts">
    import Icon from "$lib/ui/Icon.svelte"
    import * as icons from "@timephy/tui-icons-svelte/ICONS"

    let query = ""
    let showKeys = true
</script>

<div class="flex flex-col items-center gap-6 p-6">
    <div class="flex gap-2">
        <div class="item btn-p flex items-center gap-3">
            <p>Show Keys</p>
            <input
                type="checkbox"
                class="rounded-xl border border-step-100 bg-step-050 px-2 py-1 outline-blue"
                bind:checked={showKeys}
            />
        </div>
        <input
            type="text"
            placeholder="Search"
            class="rounded-xl border border-step-100 bg-step-050 px-2 py-1 outline-blue"
            bind:value={query}
        />
        <button class="input btn btn-p btn-thin btn-blue" on:click={() => (query = "")}>
            <Icon data={icons.x_lg} />
        </button>
    </div>
    <div class="card card-p inline-grid grid-cols-10 items-center justify-center gap-2">
        {#each Object.entries(icons) as [key, icon]}
            {#if query === "" || key.includes(query)}
                <div class="flex flex-col items-center gap-1">
                    <button class="item p-4 hover:btn hover:h-auto" on:click={() => alert(key)}>
                        <Icon data={icon} class="size-10" />
                    </button>
                    {#if showKeys}
                        <p class="max-w-[4.5rem] truncate text-[10px] text-step-600">{key}</p>
                    {/if}
                </div>
            {/if}
        {/each}
    </div>
    <a href="https://icons.getbootstrap.com" class="link text-sm">Bootstrap Icons</a>
</div>
