<script lang="ts">
    import { volumeToPercent } from "$lib/media"
    import VolumeSlider from "$lib/media/ui/settings/volume/VolumeSlider.svelte"
    import type { PeerDisplay } from "../Call.svelte"
    import Stats from "./Stats.svelte"

    /* ========================================================================================== */
    /*                                            Props                                           */
    /* ========================================================================================== */

    const {
        peer,
        connectionStateSubtitle = null,
    }: {
        peer: PeerDisplay
        connectionStateSubtitle?: string | null
    } = $props()
</script>

<div class="section">
    <h3>Volume</h3>
    <VolumeSlider bind:value={peer.gain} class="pl-section" />
    <p>Adjust the local volume of this user. <span class="text-step-450">({volumeToPercent(peer.gain)}%)</span></p>

    <hr />

    <h3>Connection Stats</h3>
    {#if connectionStateSubtitle}
        <p>{connectionStateSubtitle}</p>
        <div></div>
    {/if}
    <Stats stats={peer.stats} />

    <!-- <hr />

    <h3>Connection State</h3>
    <div class="note grid grid-cols-2 px-1.5 [&>*:nth-child(even)]:text-right">
        <div>Signaling</div>
        <div
            class={peer.signalingState === "stable"
                ? "text-green"
                : peer.signalingState === "closed"
                  ? "text-red"
                  : "text-orange"}
        >
            {peer.signalingState}
        </div>
        <div>ICE Gathering</div>
        <div
            class={peer.iceGatheringState === "complete"
                ? "text-green"
                : peer.iceGatheringState === "new"
                  ? "text-red"
                  : "text-orange"}
        >
            {peer.iceGatheringState}
        </div>
        <div>ICE Connection</div>
        <div
            class={peer.iceConnectionState === "connected"
                ? "text-green"
                : peer.iceConnectionState === "closed" ||
                    peer.iceConnectionState === "disconnected" ||
                    peer.iceConnectionState === "failed"
                  ? "text-red"
                  : "text-orange"}
        >
            {peer.iceConnectionState}
        </div>
        <div>Connection</div>
        <div
            class={peer.connectionState === "connected"
                ? "text-green"
                : peer.connectionState === "closed" ||
                    peer.connectionState === "disconnected" ||
                    peer.connectionState === "failed"
                  ? "text-red"
                  : "text-orange"}
        >
            {peer.connectionState}
        </div>
    </div> -->
</div>
