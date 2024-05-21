<script lang="ts">
    import { Icon } from "svelte-awesome"
    import { globe } from "tui-icons/icons"

    /* ========================================================================================== */
</script>

<div class="flex flex-col items-center p-6 justify-center h-full">
    <div class="item pl-2 pr-[10px] py-1 flex gap-2 items-center rounded-full">
        <Icon data={globe} class="text-step-800" />
        <p class="flex items-center -translate-y-[1px]">
            <span class="text-step-500 pr-px font-light tracking-tight">https://</span>
            group
            <span class="px-[0.5px]">.</span>
            tube
        </p>
    </div>
</div>
