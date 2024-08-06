<script lang="ts">
    import { onMount } from "svelte"
    import type { Media } from "../media"
    import Video from "../call/components/Video.svelte"
    import MediaControls from "../media/components/MediaControls.svelte"

    /* ========================================================================================== */

    let { media }: { media: Media } = $props()

    /* ========================================================================================== */

    let key = $state({})
    onMount(() => {
        const interval = setInterval(() => {
            key = {}
        }, 100)
        return () => clearInterval(interval)
    })
</script>

<div class="card card-p section">
    <Video
        stream={media.cam_video ? new MediaStream([media.cam_video]) : null}
        muted={true}
        class="item box-content aspect-[4/3] bg-step-base"
    />

    <div class="size-4 rounded-full {media.mic_volumeGateOpen ? 'bg-green' : 'bg-red'}"></div>

    <p class="note">
        <!-- mic_gain = {JSON.stringify(media.mic_gain) ?? "undefined"}
        <br />
        mic_volumeSource = {JSON.stringify(Math.round(media.mic_volumeSource ?? -99)) ??
            "undefined"}
        <br />
        mic_volumeVoice = {JSON.stringify(Math.round(media.mic_volumeVoice ?? -99)) ??
            "undefined"}
        <br />
        mic_volume = {JSON.stringify(Math.round(media.mic_volume)) ?? "undefined"}
        <br />
        mic_volumeGate = {JSON.stringify(media.mic_volumeGate) ?? "undefined"}
        <br /> -->
        mic_audioSource.label:
        {#key key}
            {JSON.stringify(media.mic_audioSource?.label) ?? "undefined"}
        {/key}
        <br />
        mic_audioSource.deviceId:
        {#key key}
            {JSON.stringify(media.mic_audioSource?.getCapabilities().deviceId) ?? "undefined"}
        {/key}
        <br />
        mic_audioSource.enabled:
        {#key key}
            {JSON.stringify(media.mic_audioSource?.enabled) ?? "undefined"}
        {/key}
        <!-- <br />
        mic_audio.deviceId:
        {#key key}
            {JSON.stringify(media.mic_audio?.getCapabilities().deviceId) ?? "undefined"}
        {/key}
        <br />
        mic_audio.enabled:
        {#key key}
            {JSON.stringify(media.mic_audio?.enabled) ?? "undefined"}
        {/key} -->
        <br />
        –
        <br />
        cam_video.label:
        {#key key}
            {JSON.stringify(media.cam_video?.label) ?? "undefined"}
        {/key}
        <br />
        cam.video.deviceId:
        {#key key}
            {JSON.stringify(media.cam_video?.getCapabilities().deviceId) ?? "undefined"}
        {/key}
        <br />
        cam.video.enabled:
        {#key key}
            {JSON.stringify(media.cam_video?.enabled) ?? "undefined"}
        {/key}
    </p>
    <!-- {#key key} -->
    <!-- <p class="!whitespace-pre">
        mic_audioSource.getSettings() =
        {#key key}
            {JSON.stringify(media.mic_audioSource?.getSettings(), null, 2) ??
                "undefined"}
        {/key}
    </p>
    <p class="!whitespace-pre">
        mic_audio.getSettings() =
        {#key key}
            {JSON.stringify(media.mic_audio?.getSettings(), null, 2) ?? "undefined"}
        {/key}
    </p> -->
    <!-- {/key} -->

    <Video
        stream={media.screen_video ? new MediaStream([media.screen_video]) : null}
        muted={true}
        class="item box-content aspect-[16/9] bg-step-base"
    />

    <div class="p-1.5">
        <p class="note">
            screen_video.deviceId:
            {#key key}
                {JSON.stringify(media.screen_video?.getCapabilities().deviceId) ?? "undefined"}
            {/key}
            <br />
            screen_video.enabled:
            {#key key}
                {JSON.stringify(media.screen_video?.enabled) ?? "undefined"}
            {/key}
            <br />
            –
            <br />
            screen_audio.deviceId:
            {#key key}
                {JSON.stringify(media.screen_audio?.getCapabilities().deviceId) ?? "undefined"}
            {/key}
            <br />
            screen_audio.enabled:
            {#key key}
                {JSON.stringify(media.screen_audio?.enabled) ?? "undefined"}
            {/key}
        </p>
    </div>
</div>

<div class="card card-p section">
    <MediaControls {media} muteMic={true} />

    <!-- <div class="p-1.5">
        {#key key}
            <p class="note">
                {JSON.stringify(
                    Math.round(media._mic_pipeline._ctx.baseLatency * 100000) / 100000,
                )}
                {JSON.stringify(media._mic_pipeline._ctx.sampleRate)}
                {JSON.stringify(media._mic_pipeline._ctx.state)}
                <br />
                source
                {JSON.stringify(media._mic_pipeline._nodes.source?.channelCount)}
                {JSON.stringify(media._mic_pipeline._nodes.source?.channelCountMode)}
                {JSON.stringify(
                    media._mic_pipeline._nodes.source?.channelInterpretation,
                )}
                {JSON.stringify(media._mic_pipeline._nodes.source?.numberOfInputs)}
                {JSON.stringify(media._mic_pipeline._nodes.source?.numberOfOutputs)}
                <br />
                sourceMerger
                {JSON.stringify(media._mic_pipeline._nodes.sourceMerger?.channelCount)}
                {JSON.stringify(
                    media._mic_pipeline._nodes.sourceMerger?.channelCountMode,
                )}
                {JSON.stringify(
                    media._mic_pipeline._nodes.sourceMerger?.channelInterpretation,
                )}
                {JSON.stringify(
                    media._mic_pipeline._nodes.sourceMerger?.numberOfInputs,
                )}
                {JSON.stringify(
                    media._mic_pipeline._nodes.sourceMerger?.numberOfOutputs,
                )}
                <br />
                sourceAnalyser
                {JSON.stringify(
                    media._mic_pipeline._nodes.sourceAnalyser?.channelCount,
                )}
                {JSON.stringify(
                    media._mic_pipeline._nodes.sourceAnalyser?.channelCountMode,
                )}
                {JSON.stringify(
                    media._mic_pipeline._nodes.sourceAnalyser?.channelInterpretation,
                )}
                {JSON.stringify(
                    media._mic_pipeline._nodes.sourceAnalyser?.numberOfInputs,
                )}
                {JSON.stringify(
                    media._mic_pipeline._nodes.sourceAnalyser?.numberOfOutputs,
                )}
                <br />
                rnnoise
                {JSON.stringify(media._mic_pipeline._nodes.rnnoise?.channelCount)}
                {JSON.stringify(media._mic_pipeline._nodes.rnnoise?.channelCountMode)}
                {JSON.stringify(
                    media._mic_pipeline._nodes.rnnoise?.channelInterpretation,
                )}
                {JSON.stringify(media._mic_pipeline._nodes.rnnoise?.numberOfInputs)}
                {JSON.stringify(media._mic_pipeline._nodes.rnnoise?.numberOfOutputs)}
                <br />
                voiceAnalyser
                {JSON.stringify(media._mic_pipeline._nodes.voiceAnalyser?.channelCount)}
                {JSON.stringify(
                    media._mic_pipeline._nodes.voiceAnalyser?.channelCountMode,
                )}
                {JSON.stringify(
                    media._mic_pipeline._nodes.voiceAnalyser?.channelInterpretation,
                )}
                {JSON.stringify(
                    media._mic_pipeline._nodes.voiceAnalyser?.numberOfInputs,
                )}
                {JSON.stringify(
                    media._mic_pipeline._nodes.voiceAnalyser?.numberOfOutputs,
                )}
                <br />
                gate
                {JSON.stringify(media._mic_pipeline._nodes.gate?.channelCount)}
                {JSON.stringify(media._mic_pipeline._nodes.gate?.channelCountMode)}
                {JSON.stringify(media._mic_pipeline._nodes.gate?.channelInterpretation)}
                {JSON.stringify(media._mic_pipeline._nodes.gate?.numberOfInputs)}
                {JSON.stringify(media._mic_pipeline._nodes.gate?.numberOfOutputs)}
                <br />
                gainNode
                {JSON.stringify(media._mic_pipeline._nodes.gainNode?.channelCount)}
                {JSON.stringify(media._mic_pipeline._nodes.gainNode?.channelCountMode)}
                {JSON.stringify(
                    media._mic_pipeline._nodes.gainNode?.channelInterpretation,
                )}
                {JSON.stringify(media._mic_pipeline._nodes.gainNode?.numberOfInputs)}
                {JSON.stringify(media._mic_pipeline._nodes.gainNode?.numberOfOutputs)}
                <br />
                analyser
                {JSON.stringify(media._mic_pipeline._nodes.analyser?.channelCount)}
                {JSON.stringify(media._mic_pipeline._nodes.analyser?.channelCountMode)}
                {JSON.stringify(
                    media._mic_pipeline._nodes.analyser?.channelInterpretation,
                )}
                {JSON.stringify(media._mic_pipeline._nodes.analyser?.numberOfInputs)}
                {JSON.stringify(media._mic_pipeline._nodes.analyser?.numberOfOutputs)}
                <br />
                output
                {JSON.stringify(media._mic_pipeline._nodes.output?.channelCount)}
                {JSON.stringify(media._mic_pipeline._nodes.output?.channelCountMode)}
                {JSON.stringify(
                    media._mic_pipeline._nodes.output?.channelInterpretation,
                )}
                {JSON.stringify(media._mic_pipeline._nodes.output?.numberOfInputs)}
                {JSON.stringify(media._mic_pipeline._nodes.output?.numberOfOutputs)}
                <br />
            </p>
        {/key}
    </div> -->
</div>
<div class="card card-p section">
    <div class="p-1.5">
        <p class="note">
            mute: {JSON.stringify(media.mute)}
            <br />
            deaf: {JSON.stringify(media.deaf)}
            <br />
            –
            <br />
            mic_active: {JSON.stringify(media.mic_active)}
            <br />
            mic_error: {JSON.stringify(media.mic_error)}
            <br />
            –
            <br />
            cam_active: {JSON.stringify(media.cam_active)}
            <br />
            cam_error: {JSON.stringify(media.cam_error)}
            <br />
            –
            <br />
            screen_active: {JSON.stringify(media.screen_active)}
            <br />
            screen_error: {JSON.stringify(media.screen_error)}
        </p>
    </div>
</div>
