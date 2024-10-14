<script lang="ts">
    import type { ComponentProps } from "svelte"
    import IconWithLabel from "./IconWithLabel.svelte"
    import Switch from "./Switch.svelte"

    let {
        icon,
        iconSize,
        label,
        value = $bindable(),
        onChange,
        disabled,
        class: CLASS,
    }: ComponentProps<typeof IconWithLabel> &
        ComponentProps<typeof Switch> & {
            class?: string
        } = $props()
</script>

<div id="SwitchLabel" class="flex items-center justify-between gap-4 {CLASS}">
    <IconWithLabel {icon} {iconSize} {label} {disabled} />
    <Switch bind:value {onChange} {disabled} />
</div>

<style lang="postcss">
    :global(.section) > #SwitchLabel {
        @apply pl-section;
    }
</style>
