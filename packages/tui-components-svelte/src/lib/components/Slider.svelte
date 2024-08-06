<script lang="ts" context="module">
    const BG_COLOR = {
        gray: "--step-100",
        blue: "--blue",
        red: "--red",
        green: "--green",
        orange: "--orange",
    }
</script>

<script lang="ts">
    import { onMount } from "svelte"

    let {
        value = $bindable(),
        min,
        max,
        step,
        leftColor = "blue",
        rightColor = "gray",
        disabled = false,
    }: {
        value: number
        min: number
        max: number
        step: number
        leftColor?: keyof typeof BG_COLOR
        rightColor?: keyof typeof BG_COLOR
        disabled?: boolean
    } = $props()

    let percentage = $derived(((value - min) / (max - min)) * 100)

    // NOTE: fixes a bug where the position of "thumb" is not updated after load
    let input: HTMLInputElement
    onMount(() => (input.value = value.toString()))
</script>

<div id="Slider" class="flex h-8 w-full items-center">
    <input
        bind:this={input}
        type="range"
        {min}
        {max}
        {step}
        bind:value
        class="h-1 w-full cursor-pointer appearance-none rounded-full disabled:cursor-default disabled:opacity-50"
        style:background="linear-gradient(to right, var({BG_COLOR[leftColor]}) {percentage}%, var({BG_COLOR[
            rightColor
        ]}) {percentage}%)"
        {disabled}
    />
</div>

<style lang="postcss">
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
        &:not([disabled])::-webkit-slider-thumb:hover {
            background-color: var(--step-100-light);
            /* border-color: var(--step-250-light); */
        }
        &:not([disabled])::-webkit-slider-thumb:active {
            background-color: var(--step-200-light);
            /* border-color: var(--step-350-light); */
        }
    }

    :global(.section) > #Slider {
        @apply px-section;
    }
</style>
