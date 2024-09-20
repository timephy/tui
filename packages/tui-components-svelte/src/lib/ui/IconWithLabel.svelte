<script lang="ts">
    import Icon, { type IconType } from "$lib/ui/Icon.svelte"

    let {
        icon,
        iconSize = "md",
        label,
        disabled = false,
    }: {
        icon?: IconType
        iconSize?: "sm" | "md"
        label: string
        disabled?: boolean
    } = $props()
</script>

<div id="IconWithLabel" class="flex items-center gap-2 {disabled ? 'opacity-50' : ''}">
    {#if icon}
        <Icon data={icon} class="w-5 {iconSize === 'md' ? 'h-5' : 'h-4'} text-step-500 " />
    {/if}
    <p>{label}</p>
</div>

<style lang="postcss">
    :global(.section) > #IconWithLabel {
        @apply pl-section;
    }
</style>
