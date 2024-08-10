<script lang="ts">
    import { Icon, type IconType } from "@timephy/tui-icons-svelte"
    import type { ComponentProps } from "svelte"
    import Switch from "./Switch.svelte"

    let {
        icon,
        label,
        class: CLASS,
        value = $bindable(),
        onChange,
        disabled,
    }: ComponentProps<Switch> & {
        icon?: IconType
        label: string
        class?: string
    } = $props()
</script>

<div id="SwitchLabel" class="flex items-center justify-between gap-4 {CLASS}">
    <div class="flex items-center gap-2">
        {#if icon}
            <Icon data={icon} class="size-5 text-step-500" />
        {/if}
        <p class={disabled ? "opacity-50" : ""}>{label}</p>
    </div>
    <Switch bind:value {onChange} {disabled} />
</div>

<style lang="postcss">
    :global(.section) > #SwitchLabel {
        @apply pl-section;
    }
</style>
