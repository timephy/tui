<!--
    @component
    Settings for audio input (noise suppression, volume gate, and monitoring).
-->

<script lang="ts">
    import Slider from "$lib/components/Slider.svelte"
    import SwitchLabel from "$lib/components/SwitchLabel.svelte"
    import { DEFAULT_MIC_VOLUME_GATE, Media } from "$lib/media"
    import VolumeMeter, * as Volume from "$lib/media/components/settings/volume/VolumeMeter.svelte"
    import VolumeSlider from "$lib/media/components/settings/volume/VolumeSlider.svelte"
    import filter_left from "@timephy/tui-icons-svelte/filter_left"
    import soundwave from "@timephy/tui-icons-svelte/soundwave"
    import volume_mute_fill from "@timephy/tui-icons-svelte/volume_mute_fill"
    import volume_up_fill from "@timephy/tui-icons-svelte/volume_up_fill"

    let {
        media,
        debug = false,
    }: {
        media: Media
        debug?: boolean
    } = $props()
</script>

<div class="section">
    {#if debug}
        <!-- <p>Source input volume (direct from mic).</p> -->
        <div class="px-section">
            <VolumeMeter volume={media.mic_volumeSource} class="w-full px-[0.625rem]" />
        </div>

        <hr />
    {/if}

    <!-- NOTE: Padding is 1/2 of Slider Thumb width -->
    <SwitchLabel
        icon={soundwave}
        label="Noise Suppression"
        bind:value={media.mic_noiseSuppression}
    />
    {#if media.mic_noiseSuppressionLoaded === false}
        <p class="!text-orange">Could not load, noise suppression is disabled.</p>
    {:else}
        <p>Suppress background noise and isolate voice.</p>
    {/if}

    <div class="h-1"></div>

    <SwitchLabel
        icon={filter_left}
        label="Volume Gate"
        value={media.mic_volumeGate !== null}
        onChange={(value) => (media.mic_volumeGate = value ? DEFAULT_MIC_VOLUME_GATE : null)}
        class="grow"
    />
    <p>Only pass audio above this volume ({media.mic_volumeGate}dB).</p>

    {#if media.mic_volumeGate !== null}
        <Slider
            bind:value={media.mic_volumeGate}
            min={Volume.min}
            max={Volume.max}
            step={1}
            leftColor="gray"
            rightColor="green"
        />
    {/if}

    <div class="h-1"></div>

    <div class="px-section">
        {#if media.mic_volumeVoice !== null && media.mic_volumeGate !== null}
            <VolumeMeter
                volume={media.mic_volumeVoice}
                color={media.mic_volumeVoice > media.mic_volumeGate
                    ? "green"
                    : media.mic_volumeGateOpen
                      ? "orange"
                      : "red"}
                barClass={media.mic_volumeVoice > media.mic_volumeGate
                    ? ""
                    : media.mic_volumeGateOpen
                      ? "bg-opacity-75"
                      : "bg-opacity-25"}
                class="w-full px-[0.625rem]"
            />
        {:else}
            <VolumeMeter
                volume={media.mic_volumeVoice}
                color="green"
                class="w-full px-[0.625rem]"
            />
        {/if}
    </div>

    <hr />

    <SwitchLabel
        icon={media.mic_playback ? volume_up_fill : volume_mute_fill}
        label="Monitor Audio"
        bind:value={media.mic_playback}
    />
    <p>Test your input and change the volume ({JSON.stringify(media.mic_gain)}x).</p>

    <VolumeSlider bind:value={media.mic_gain} class="pl-section" />

    {#if debug}
        <hr />

        <div class="px-section">
            <VolumeMeter volume={media.mic_volumeOutput} class="w-full px-[0.625rem]" />
        </div>
    {/if}
</div>
