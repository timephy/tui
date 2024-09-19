<script lang="ts">
    import volume_mute_fill from "@timephy/tui-icons-svelte/volume_mute_fill"
    import MediaState from "../../../media/ui/MediaState.svelte"
    import VolumeMeter from "../../../media/ui/settings/volume/VolumeMeter.svelte"
    import VolumeSlider from "../../../media/ui/settings/volume/VolumeSlider.svelte"
    import type { Peer } from "../../peer/Peer.svelte"
    import Stats from "../Stats.svelte"
    import Video from "../Video.svelte"

    /* ========================================================================================== */

    let { peer }: { peer: Peer } = $props()
</script>

<div class="section">
    <div class="section flex flex-row items-center justify-between gap-4">
        <h1 class="truncate">{peer._debug_id}</h1>
        <MediaState
            debug
            mediaState={peer.mediaState}
            extraIcons={peer.gain === 0 ? [{ data: volume_mute_fill, class: "text-orange" }] : []}
        />
    </div>

    {#if peer.mediaState.cam}
        <Video stream={peer.micCamStream} muted={true} class="item box-content bg-step-base" />
    {/if}
    {#if peer.mediaState.screen}
        <Video stream={peer.screenStream} muted={false} class="item box-content bg-step-base" />
    {/if}

    <div></div>

    <Stats stats={peer.stats} />

    <div class="note grid grid-cols-2 px-1.5 [&>*:nth-child(even)]:text-right">
        <div>signalingState</div>
        <div
            class={peer.signalingState === "stable"
                ? "text-green"
                : peer.signalingState === "closed"
                  ? "text-red"
                  : "text-orange"}
        >
            {peer.signalingState}
        </div>
        <div>iceGatheringState</div>
        <div
            class={peer.iceGatheringState === "complete"
                ? "text-green"
                : peer.iceGatheringState === "new"
                  ? "text-red"
                  : "text-orange"}
        >
            {peer.iceGatheringState}
        </div>
        <div>iceConnectionState</div>
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
        <div>connectionState</div>
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
        <!-- <div>&nbsp;</div>
        <div>&nbsp;</div>
        <div>_polite</div>
        <div>{peer._polite}</div> -->
    </div>

    {#if false}
        <p class="note whitespace-pre">{JSON.stringify(peer.stats.mic_audio_sent, null, 2)}</p>
        <p class="note whitespace-pre">{JSON.stringify(peer.stats.cam_video_sent, null, 2)}</p>
        <p class="note whitespace-pre">{JSON.stringify(peer.stats.screen_video_sent, null, 2)}</p>
        <p class="note whitespace-pre">{JSON.stringify(peer.stats.screen_audio_sent, null, 2)}</p>
        <hr />
        <p class="note whitespace-pre">{JSON.stringify(peer.stats.mic_audio_recv, null, 2)}</p>
        <p class="note whitespace-pre">{JSON.stringify(peer.stats.cam_video_recv, null, 2)}</p>
        <p class="note whitespace-pre">{JSON.stringify(peer.stats.screen_video_recv, null, 2)}</p>
        <p class="note whitespace-pre">{JSON.stringify(peer.stats.screen_audio_recv, null, 2)}</p>
    {/if}

    <div></div>

    <VolumeMeter volume={peer.volume} class="w-full px-[0.625rem]" />
    <VolumeSlider bind:value={peer.gain} class="pl-section" />
    <p>Change the volume of this peer ({JSON.stringify(peer.gain)}x).</p>
</div>
