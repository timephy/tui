<script lang="ts">
    import { Icon } from "svelte-awesome"
    import * as icons from "tui-icons/icons/index"
</script>

<div class="flex flex-col items-center p-6">
    <div class="card p-6 inline-grid grid-cols-10 gap-2 justify-center items-center">
        {#each Object.values(icons) as icon}
            <div class="item p-4">
                <Icon data={icon} class="size-12" />
            </div>
        {/each}
    </div>
</div>
