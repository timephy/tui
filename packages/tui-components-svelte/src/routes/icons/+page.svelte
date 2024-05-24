<script lang="ts">
    import * as icons from "@timephy/tui-icons-svelte"
    import { Icon } from "svelte-awesome"
</script>

<div class="flex flex-col items-center p-6">
    <div class="card inline-grid grid-cols-10 items-center justify-center gap-2 p-6">
        {#each Object.values(icons) as icon}
            <div class="item p-4">
                <Icon data={icon} class="size-12" />
            </div>
        {/each}
    </div>
</div>
