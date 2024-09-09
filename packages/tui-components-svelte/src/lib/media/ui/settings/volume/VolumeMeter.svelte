<!--
    @component
    A volume meter (bar chart) for displaying the volume of an audio stream.
-->

<script lang="ts" context="module">
    export const steps = [-80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20]
    export const min = Math.min(...steps)
    export const max = Math.max(...steps)

    function clamp(value: number): number {
        return Math.max(0, Math.min(100, value))
    }

    function fraction(volume: number): number {
        return ((volume - min) / (max - min)) * 100
    }

    const BG = {
        green: "bg-green",
        gray: "bg-gray",
        orange: "bg-orange",
        red: "bg-red",
        blue: "bg-blue",
    } as const
</script>

<script lang="ts">
    let {
        volume,
        color = "green",
        class: CLASS,
        barClass,
    }: {
        volume: number | null
        color?: keyof typeof BG
        class?: string
        barClass?: string
    } = $props()
</script>

<div class="h-10 select-none {volume === null ? 'opacity-25' : ''} {CLASS}">
    <div class="relative h-full w-full">
        {#each steps as step}
            <div
                class="absolute top-0 h-[calc(100%-1rem)] w-px -translate-x-1/2 bg-step-200"
                style:left={fraction(step) + "%"}
            ></div>
            <p class="absolute bottom-0 -translate-x-1/2 text-[0.5rem] text-step-500" style:left={fraction(step) + "%"}>
                {step}
            </p>
        {/each}
        <div
            class="absolute left-0 top-1 h-[calc(100%-1.5rem)] {BG[color]} {barClass}"
            style:width={volume !== null ? clamp(fraction(volume)) + "%" : "0%"}
        ></div>
    </div>
</div>
