<!--
    @component
    Controls for media inputs (microphone, camera, and screen sharing) + deaf/mute.

    Simply renders 3 or 4 buttons (screen button is only rendered if `media.screen_available`).
-->

<script lang="ts">
    import Icon, { type IconType } from "$lib/ui/Icon.svelte"
    import camera_video_fill from "@timephy/tui-icons-svelte/camera_video_fill"
    import display from "@timephy/tui-icons-svelte/display"
    import display_fill from "@timephy/tui-icons-svelte/display_fill"
    import mic_fill from "@timephy/tui-icons-svelte/mic_fill"
    import mic_mute_fill from "@timephy/tui-icons-svelte/mic_mute_fill"
    import volume_mute_fill from "@timephy/tui-icons-svelte/volume_mute_fill"
    import volume_up_fill from "@timephy/tui-icons-svelte/volume_up_fill"
    import { type Media } from "../Media.svelte"

    /* ========================================================================================== */

    // NOTE: only because of auto-formatting fails with arrow function in snippet
    type OnClick = (event: MouseEvent) => void

    /* ========================================================================================== */
    /*                                            Props                                           */
    /* ========================================================================================== */

    let {
        media,
        muteMic = true,
    }: {
        media: Media
        /** Mute mic instead of deactivating (default = true). */
        muteMic?: boolean
    } = $props()
</script>

{#snippet btn({
    onclick,
    class: CLASS,
    disabled,
    icon,
    text = null,
}: {
    class: string
    disabled: boolean
    icon: IconType
    text?: string | null
    onclick: OnClick
})}
    <button tabindex={-1} {onclick} class="btn btn-tall gap-2 outline outline-2 {CLASS}" {disabled}>
        <Icon data={icon} class="size-[18px]" />
        {#if text !== null}
            <p>{text}</p>
        {/if}
    </button>
{/snippet}

{@render btn({
    onclick: (event: MouseEvent) => {
        // enabled when disabled + disable when !muteMic or shift key
        if (!media.mic_active || !muteMic || event.shiftKey) {
            // activate mic when it is inactive
            const wasActive = media.mic_active
            media.mic_active = !media.mic_active
            // when deactivating, unmute the mic
            if (wasActive) media.mute = false
        } else {
            // if mic is active and should not be deactivated, toggle mute
            media.mute = !media.mute
        }
    },
    disabled: media.deaf || !navigator.mediaDevices?.getUserMedia,
    class: media.mic_error || !media.mic_active || media.mute || media.deaf ? "!outline-red" : "!outline-blue",
    icon: media.mic_error || !media.mic_active || media.mute || media.deaf ? mic_mute_fill : mic_fill,
})}

{@render btn({
    onclick: () => (media.deaf = !media.deaf),
    disabled: false,
    class: media.deaf ? "!outline-red" : "!outline-blue",
    icon: media.deaf ? volume_mute_fill : volume_up_fill,
})}

{@render btn({
    onclick: () => (media.cam_active = !media.cam_active),
    disabled: !navigator.mediaDevices?.getUserMedia,
    class: media.cam_error ? "!outline-red" : media.cam_active ? "!outline-blue" : "!outline-0",
    icon: media.cam_active ? camera_video_fill : camera_video_fill,
})}

{#if media.screen_available}
    {@render btn({
        onclick: () => (media.screen_active = !media.screen_active),
        disabled: false,
        class:
            // NOTE: disabled error outline, because screen sharing is often cancelled by the user
            // media.screen_error ? "!outline-red" : media.screen_active ? "!outline-blue" : "!outline-0"
            media.screen_active ? "!outline-blue" : "!outline-0",
        icon: media.screen_active ? display_fill : display,
    })}
{/if}
