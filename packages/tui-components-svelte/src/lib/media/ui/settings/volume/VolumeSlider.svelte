<!--
    @component
    A slider element for adjusting the volume of an audio stream + reset button.
-->

<script lang="ts">
    import Slider from "$lib/ui/Slider.svelte"
    import arrow_counterclockwise from "@timephy/tui-icons-svelte/arrow_counterclockwise"
    import Icon from "$lib/ui/Icon.svelte"

    let {
        value = $bindable(),
        min = 0,
        max = 4,
        step = 0.05,
        class: CLASS = "",
    }: {
        value: number
        min?: number
        max?: number
        step?: number
        class?: string
    } = $props()
</script>

<div class="flex items-center gap-3 {CLASS}">
    <Slider bind:value {min} {max} {step} rightColor={value === 0 ? "orange" : undefined} />

    <button class="btn btn-thin btn-transparent aspect-square" onclick={() => (value = 1)} disabled={value === 1}>
        <Icon data={arrow_counterclockwise} class="size-5" />
    </button>
</div>
