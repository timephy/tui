<!--
    @component
    A table of statistics for a peer connection (packet loss, bandwidth, video resolution, etc).
-->

<script lang="ts">
    import type { Stats, Video } from "../Stats.svelte"

    let { stats }: { stats: Stats } = $props()

    let {
        averaged_seconds,
        general_recv,
        general_sent,
        cam_video_recv,
        cam_video_sent,
        screen_video_recv,
        screen_video_sent,
    } = $derived(stats)
</script>

<div class="item grid grid-cols-3 items-center gap-x-2 gap-y-0.5 px-4 py-3 text-sm">
    <p class="subtitle">over last {averaged_seconds}s</p>
    <p class="title">In</p>
    <p class="title">Out</p>

    <hr class="my-2" />
    <hr class="my-2" />
    <hr class="my-2" />

    <p class="title">Packet loss</p>
    <p class="value">
        {#if general_recv && general_sent}
            {@const packetLoss =
                Math.round(
                    (general_recv.packetsLost / (general_recv.packetsLost + general_recv.packetsReceived)) * 100 * 100,
                ) / 100}
            {isNaN(packetLoss) ? "100" : packetLoss === 0 ? "0.00" : packetLoss} <span class="unit">%</span>
        {:else}
            <span class="unit">–</span>
        {/if}
    </p>
    <p class="value"></p>

    <p class="title">Bandwidth</p>
    <p class="value">
        {#if general_recv}
            {Math.round((general_recv.bytesReceived / 1024 / averaged_seconds) * 10) / 10}
            <span class="unit">KB/s</span>
        {:else}
            <span class="unit">–</span>
        {/if}
    </p>
    <p class="value">
        {#if general_sent}
            {Math.round((general_sent.bytesSent / 1024 / averaged_seconds) * 10) / 10}
            <span class="unit">KB/s</span>
        {:else}
            <span class="unit">–</span>
        {/if}
    </p>

    <hr class="my-2" />
    <hr class="my-2" />
    <hr class="my-2" />

    <p class="title">Camera</p>
    {@render videoDetails(cam_video_recv)}
    {@render videoDetails(cam_video_sent)}

    <p class="title">Screen</p>
    {@render videoDetails(screen_video_recv)}
    {@render videoDetails(screen_video_sent)}

    {#snippet videoDetails(video: Video | null)}
        <div class="value flex h-[2lh] flex-col justify-center">
            {#if video?.framesPerSecond}
                <div class="flex gap-1">
                    {video.frameWidth}
                    <span class="unit">✕</span>
                    {video.frameHeight}
                </div>
                <p>
                    {video.framesPerSecond}
                    <span class="unit">fps</span>
                </p>
            {:else}
                <span class="unit">–</span>
            {/if}
        </div>
    {/snippet}
</div>

<style lang="postcss">
    .title {
        @apply font-medium text-step-800;
    }
    .subtitle {
        @apply text-xs italic text-step-700;
    }
    .value {
        @apply font-mono text-xs text-step-500;
    }
    .unit {
        @apply font-sans text-step-450;
    }
</style>
