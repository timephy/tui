<!--
    @component
    Settings for audio input (noise suppression, volume gate, and monitoring).
-->

<script lang="ts">
    import { type Media } from "$lib/media"
    import VolumeMeter, * as Volume from "$lib/media/ui/settings/volume/VolumeMeter.svelte"
    import VolumeSlider from "$lib/media/ui/settings/volume/VolumeSlider.svelte"
    import { MIN_VOLUME } from "$lib/media/volume"
    import Slider from "$lib/ui/Slider.svelte"
    import SwitchLabel from "$lib/ui/SwitchLabel.svelte"
    import filter_left from "@timephy/tui-icons-svelte/filter_left"
    import soundwave from "@timephy/tui-icons-svelte/soundwave"
    import volume_mute_fill from "@timephy/tui-icons-svelte/volume_mute_fill"
    import volume_up_fill from "@timephy/tui-icons-svelte/volume_up_fill"
    import type { ComponentProps } from "svelte"

    /* ============================================================================================================== */
    /*                                                      Props                                                     */
    /* ============================================================================================================== */

    let {
        media,
        debug = false,
    }: {
        media: Media
        debug?: boolean
    } = $props()

    /* ============================================================================================================== */

    const volumeSliderProps = {
        min: Volume.min,
        max: Volume.max,
        step: 1,
        leftColor: "gray",
        rightColor: "green",
    } satisfies Partial<ComponentProps<Slider>>

    /** Special padding to align the VolumeMeter perfectly with the Slider thumb. */
    const volumeMeterClass = "w-full px-[0.625rem]"
</script>

<div class="section">
    {#if debug}
        <!-- <p>Source input volume (direct from mic).</p> -->
        <div class="px-section">
            <VolumeMeter color="gray" volume={media._mic_pipeline.debugVolumeSource} class={volumeMeterClass} />
        </div>

        <hr />
    {/if}

    <!-- NOTE: Padding is 1/2 of Slider Thumb width -->
    <SwitchLabel icon={soundwave} label="Noise Suppression" bind:value={media.mic_noiseSuppression} />
    {#if media.mic_noiseSuppressionLoaded === false}
        <p class="!text-orange">Could not load, noise suppression is disabled.</p>
    {:else}
        <p>Suppress background noise and isolate voice.</p>
    {/if}

    <div class="h-1"></div>

    <SwitchLabel icon={filter_left} label="Volume Gate" bind:value={media.mic_volumeGate} class="grow" />
    <p>Only pass audio above this volume{media.mic_volumeGate ? ` (${media.mic_volumeGateThreshold}dB)` : ""}.</p>

    {#if media.mic_volumeGate}
        <Slider bind:value={media.mic_volumeGateThreshold} {...volumeSliderProps} />
    {:else}
        <Slider disabled value={MIN_VOLUME} {...volumeSliderProps} />
    {/if}

    <div class="h-1"></div>

    <div class="px-section">
        {#if media.mic_volumeGate === true}
            <VolumeMeter
                volume={media.mic_volumeVoice}
                color={media.mic_volumeVoice > media.mic_volumeGateThreshold
                    ? "green"
                    : media.mic_outputIsSending
                      ? "orange"
                      : "red"}
                barClass={media.mic_volumeVoice > media.mic_volumeGateThreshold
                    ? ""
                    : media.mic_outputIsSending
                      ? "bg-opacity-75"
                      : "bg-opacity-25"}
                class={volumeMeterClass}
            />
        {:else}
            <VolumeMeter volume={media.mic_volumeVoice} color="green" class={volumeMeterClass} />
        {/if}

        {#if debug}
            <Slider disabled value={media._mic_pipeline.debugGateFactor} min={0} max={1} step={0.01} />
        {/if}
    </div>

    <hr />

    <SwitchLabel
        icon={media.mic_playback ? volume_up_fill : volume_mute_fill}
        label="Monitor Audio"
        bind:value={media.mic_playback}
    />
    <p>Test your input and change the volume ({JSON.stringify(media.mic_gain)}x).</p>

    <!-- NOTE: Set min above 0 to not let you mute yourself permanently -->
    <VolumeSlider bind:value={media.mic_gain} min={0.25} class="pl-section" />

    {#if debug}
        <hr />

        <div class="px-section">
            <VolumeMeter color="gray" volume={media._mic_pipeline.debugVolumeOutput} class={volumeMeterClass} />
        </div>
    {/if}
</div>
