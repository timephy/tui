<!--
    @component
    Settings for audio input (noise suppression, volume gate, and monitoring).
-->

<script lang="ts">
    import { volumeToPercent, type Media } from "$lib/media"
    import VolumeMeter, * as Volume from "$lib/media/ui/settings/volume/VolumeMeter.svelte"
    import VolumeSlider from "$lib/media/ui/settings/volume/VolumeSlider.svelte"
    import { MIN_VOLUME } from "$lib/media/volume"
    import Icon from "$lib/ui/Icon.svelte"
    import IconWithLabel from "$lib/ui/IconWithLabel.svelte"
    import Slider from "$lib/ui/Slider.svelte"
    import SwitchLabel from "$lib/ui/SwitchLabel.svelte"
    import filter_left from "@timephy/tui-icons-svelte/filter_left"
    import soundwave from "@timephy/tui-icons-svelte/soundwave"
    import volume_up_fill from "@timephy/tui-icons-svelte/volume_up_fill"
    import { onDestroy, type ComponentProps } from "svelte"

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

    onDestroy(() => {
        // INFO: Stop the test playback when the component is destroyed.
        media.mic_playback = false
    })

    /* ============================================================================================================== */

    const volumeSliderProps = {
        min: Volume.min,
        max: Volume.max,
        step: 1,
        leftColor: "gray",
        rightColor: "green",
    } satisfies Partial<ComponentProps<typeof Slider>>

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

    <!-- MARK: Noise Supression -->
    <!-- INFO: Padding is 1/2 of Slider Thumb width -->
    <SwitchLabel icon={soundwave} label="Noise Suppression" bind:value={media.mic_noiseSuppression} />
    {#if media.mic_noiseSuppressionLoaded === false}
        <p class="!text-orange">Could not load, noise suppression is disabled.</p>
    {:else}
        <p>
            Suppress background noise. <span>
                ({media.mic_noiseSuppression ? "active" : "recommended"})
            </span>
        </p>
    {/if}

    <div class="h-1"></div>

    <!-- MARK: Volume Gate -->
    <SwitchLabel icon={filter_left} label="Volume Gate" bind:value={media.mic_volumeGate} class="grow" />
    <p>
        Only pass audio above this volume. <span>
            ({media.mic_volumeGate ? `${media.mic_volumeGateThreshold}dB` : "recommended"})
        </span>
    </p>

    {#if media.mic_volumeGate}
        <Slider bind:value={media.mic_volumeGateThreshold} {...volumeSliderProps} />
    {:else}
        <Slider disabled value={MIN_VOLUME} {...volumeSliderProps} />
    {/if}

    <!-- Space between Slider and VolumeMeter -->
    <div></div>

    <div class="px-section">
        {#if media.mic_volumeGate === true}
            <VolumeMeter
                volume={media.mic_volumeVoice}
                color={media.mic_volumeVoice > media.mic_volumeGateThreshold
                    ? "green"
                    : media.mic_volumeGateOpen
                      ? "orange"
                      : "red"}
                barClass={media.mic_volumeVoice > media.mic_volumeGateThreshold
                    ? ""
                    : media.mic_volumeGateOpen
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
    <!-- MARK: Volume -->

    <!-- NOTE: 28px is same height as SwitchLabel -->
    <!-- <IconWithLabel icon={mic_fill} iconSize="sm" label="Change Volume" class="h-[28px]" /> -->
    <IconWithLabel label="Change Volume" class="h-[28px]" />
    <p>Adjust the output volume. <span>({volumeToPercent(media.mic_gain)}%)</span></p>

    <!-- INFO: Set min above 0 to not let you mute yourself permanently -->
    <VolumeSlider bind:value={media.mic_gain} min={0.2} class="pl-section" />

    <!-- Space between Slider and Button -->
    <div></div>

    <button
        class="btn btn-p btn-thin flex gap-[10px] {media.mic_playback ? 'btn-blue' : ''} "
        onclick={() => (media.mic_playback = !media.mic_playback)}
        disabled={!media.mic_active}
    >
        {#if !media.mic_playback}
            <p>Test Microphone</p>
        {:else}
            <Icon data={volume_up_fill} />
            <p>Stop Test</p>
        {/if}
    </button>
    <!-- <SwitchLabel
        disabled={!media.mic_active}
        icon={media.mic_playback ? volume_up_fill : volume_mute_fill}
        label="Test Microphone"
        bind:value={media.mic_playback}
    />
    <p>Listen to your microphone input and settings.</p> -->

    {#if debug}
        <hr />

        <div class="px-section">
            <VolumeMeter color="gray" volume={media._mic_pipeline.debugVolumeOutput} class={volumeMeterClass} />
        </div>
    {/if}
</div>

<style lang="postcss">
    span {
        @apply text-step-450;
    }
</style>
