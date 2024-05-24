<script lang="ts">
    let {
        value = $bindable(),
        min,
        max,
        step,
    }: { value: number; min: number; max: number; step: number } = $props()

    let percentage = $derived(value * (100 / max))
</script>

<div class="flex h-6 w-full items-center">
    <input
        type="range"
        {min}
        {max}
        {step}
        bind:value
        class="h-1 w-full cursor-pointer appearance-none rounded-full"
        style:background="linear-gradient(to right, var(--blue-000) {percentage}%, var(--step-100) {percentage}%)"
    />
</div>

<style>
    input[type="range"] {
        &::-webkit-slider-thumb {
            appearance: none;
            height: 1.25rem;
            width: 1.25rem;
            border-radius: 9999px;
            background-color: var(--step-000-light);
            /* border does not work on this element */
            /* border-width: 2px; */
            /* border-color: var(--step-150-light); */
        }
        &::-webkit-slider-thumb:hover {
            background-color: var(--step-100-light);
            /* border-color: var(--step-250-light); */
        }
        &::-webkit-slider-thumb:active {
            background-color: var(--step-200-light);
            /* border-color: var(--step-350-light); */
        }
    }
</style>
