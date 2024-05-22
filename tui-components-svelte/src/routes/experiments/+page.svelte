<script lang="ts">
    import { globe } from "@timephy/tui-icons-svelte"
    import { Icon } from "svelte-awesome"

    /* ========================================================================================== */
</script>

<div class="flex h-full flex-col items-center justify-center p-6">
    <div class="item flex items-center gap-2 rounded-full py-1 pl-2 pr-[10px]">
        <Icon data={globe} class="text-step-800" />
        <p class="flex -translate-y-[1px] items-center">
            <span class="text-step-500 pr-px font-light tracking-tight">https://</span>
            group
            <span class="px-[0.5px]">.</span>
            tube
        </p>
    </div>
</div>
