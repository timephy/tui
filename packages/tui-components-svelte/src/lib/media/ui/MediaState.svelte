<!--
    @component
    A row of icons displaying the given MediaState.
    Shows the status of the microphone, camera, screen and screen audio devices, as well as the mute and deaf state.
-->

<script lang="ts" module>
    type MicState = "enabled" | "disabled" | "muted"
    type DeafState = "enabled" | "disabled"
    type CamState = "enabled" | "disabled"
    type ScreenState = "enabled" | "disabled"

    /**
     * A mapping for each device type containing the states that should be displayed.
     *
     * "disabled" devices should usually not be shown to the end user, except for the microphone.
     */
    export type DisplayConfig = {
        mic: MicState[]
        deaf: DeafState[]
        cam: CamState[]
        screen: ScreenState[]
        screen_audio: ScreenState[]
    }

    /* ========================================================================================== */

    /** Show states that may be unexpected/unwanted. */
    export const DEFAULT_CONFIG: DisplayConfig = {
        mic: ["disabled", "muted"],
        deaf: ["enabled"],
        cam: ["enabled"],
        screen: ["enabled"],
        screen_audio: ["enabled"],
    }

    /** Show all states. */
    const DEBUG_CONFIG: DisplayConfig = {
        mic: ["enabled", "disabled", "muted"],
        deaf: ["enabled", "disabled"],
        cam: ["enabled", "disabled"],
        screen: ["enabled", "disabled"],
        screen_audio: ["enabled", "disabled"],
    }

    /* ========================================================================================== */
    /*                           State Definitions for all Media Devices                          */
    /* ========================================================================================== */

    type State = {
        data: IconType
        class: string
    }

    const CLASS_DISABLED = "opacity-50"

    const MIC: Record<MicState, State> = {
        enabled: { data: mic_fill, class: "opacity-50" },
        disabled: { data: mic_mute, class: CLASS_DISABLED },
        muted: { data: mic_mute_fill, class: "" },
    }
    const DEAF: Record<DeafState, State> = {
        enabled: { data: volume_mute_fill, class: "" },
        disabled: { data: volume_up, class: "opacity-50" },
    }
    const CAM: Record<CamState, State> = {
        enabled: { data: camera_video_fill, class: "" },
        disabled: { data: camera_video_off, class: CLASS_DISABLED },
    }
    const SCREEN: Record<ScreenState, State> = {
        enabled: { data: display_fill, class: "" },
        disabled: { data: display, class: CLASS_DISABLED },
    }
    const SCREEN_AUDIO: Record<ScreenState, State> = {
        enabled: { data: volume_up_fill, class: "" },
        disabled: { data: volume_up, class: CLASS_DISABLED },
    }
</script>

<script lang="ts">
    import Icon, { type IconType } from "$lib/ui/Icon.svelte"
    import camera_video_fill from "@timephy/tui-icons-svelte/camera_video_fill"
    import camera_video_off from "@timephy/tui-icons-svelte/camera_video_off"
    import display from "@timephy/tui-icons-svelte/display"
    import display_fill from "@timephy/tui-icons-svelte/display_fill"
    import mic_fill from "@timephy/tui-icons-svelte/mic_fill"
    import mic_mute from "@timephy/tui-icons-svelte/mic_mute"
    import mic_mute_fill from "@timephy/tui-icons-svelte/mic_mute_fill"
    import volume_mute_fill from "@timephy/tui-icons-svelte/volume_mute_fill"
    import volume_up from "@timephy/tui-icons-svelte/volume_up"
    import volume_up_fill from "@timephy/tui-icons-svelte/volume_up_fill"
    import type { MediaState as IMediaState } from "../MediaState"

    /* ========================================================================================== */
    /*                                            Props                                           */
    /* ========================================================================================== */

    let {
        mediaState,
        debug = false,
        config: _config,
        extraIcons = [],
        class: CLASS,
    }: {
        mediaState: IMediaState
        debug?: boolean
        config?: DisplayConfig
        extraIcons?: State[]
        class?: string
    } = $props()

    let config = $derived(_config ?? (debug ? DEBUG_CONFIG : DEFAULT_CONFIG))

    let micState: MicState = $derived(
        !mediaState.mic ? "disabled" : mediaState.mute || mediaState.deaf ? "muted" : "enabled",
    )
    let deafState: DeafState = $derived(!mediaState.deaf ? "disabled" : "enabled")
    let camState: CamState = $derived(!mediaState.cam ? "disabled" : "enabled")
    let screenState: ScreenState = $derived(!mediaState.screen ? "disabled" : "enabled")
    let screenAudioState: ScreenState = $derived(!mediaState.screen_audio ? "disabled" : "enabled")

    /* ========================================================================================== */
    /*                                            State                                           */
    /* ========================================================================================== */

    const show_mic = $derived(config.mic.includes(micState))
    const show_deaf = $derived(config.deaf.includes(deafState))
    const show_cam = $derived(config.cam.includes(camState))
    const show_screen = $derived(config.screen.includes(screenState))
    const show_screen_audio = $derived(config.screen_audio.includes(screenAudioState))
</script>

{#if show_mic || show_deaf || show_cam || show_screen || show_screen_audio || extraIcons.length > 0}
    <div class="flex items-center gap-3 {CLASS}">
        <!-- !! Mic -->
        {#if show_mic}
            <Icon {...MIC[micState]} />
        {/if}

        <!-- !! Deaf -->
        {#if show_deaf}
            <Icon {...DEAF[deafState]} />
        {/if}

        <!-- !! Cam -->
        {#if show_cam}
            <Icon {...CAM[camState]} />
        {/if}

        <!-- !! Screen Video -->
        {#if show_screen}
            <Icon {...SCREEN[screenState]} />
        {/if}

        <!-- !! Screen Audio -->
        {#if show_screen_audio}
            <Icon {...SCREEN_AUDIO[screenAudioState]} />
        {/if}

        {#each extraIcons as extraIcon}
            <Icon {...extraIcon} />
        {/each}
    </div>
{/if}
