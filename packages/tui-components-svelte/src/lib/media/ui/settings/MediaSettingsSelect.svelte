<!--
    @component
    Settings for media input (microphone, camera, and screen resolution).
-->

<script lang="ts">
    import Select from "$lib/ui/Select.svelte"
    import display from "@timephy/tui-icons-svelte/display"
    import { type Media } from "../../Media.svelte"
    import { RESOLUTIONS } from "../../shared"
    import SelectCam from "./select/SelectCam.svelte"
    import SelectMic from "./select/SelectMic.svelte"

    let {
        media,
        debug = false,
    }: {
        media: Media
        debug?: boolean
    } = $props()
</script>

<div class="section">
    <!-- !! Mic -->
    <h3>Microphone</h3>
    <SelectMic {media} />
    <!-- NOTE: Check for device list too, because in Safari permissions are not updated -->
    {#if media.mic_permission === "denied" && media.mic_devices.length === 0}
        <p class="!text-red">Allow access in browser settings.</p>
    {:else if media.mic_id === null}
        <p>Select a microphone to use.</p>
    {/if}

    {#if debug}
        <p class="truncate font-mono">
            value = {JSON.stringify(media.mic_id)}
            <br />
            permission = {JSON.stringify(media.mic_permission)}
        </p>
    {/if}

    <div></div>

    <!-- !! Cam -->
    <h3>Camera</h3>
    <SelectCam {media} />
    <!-- NOTE: Check for device list too, because in Safari permissions are not updated -->
    {#if media.cam_permission === "denied" && media.cam_devices.length === 0}
        <p class="!text-red">Allow access in browser settings.</p>
    {:else if media.cam_id === null}
        <p>Select a camera to use.</p>
    {/if}

    {#if debug}
        <p class="truncate font-mono">
            value = {JSON.stringify(media.cam_id)}
            <br />
            permission = {JSON.stringify(media.cam_permission)}
        </p>
    {/if}

    <div></div>

    <!-- !! Screen -->
    <h3>Screen Resolution</h3>
    <Select bind:value={media.screen_maxHeight} options={RESOLUTIONS} icon={display} />
    {#if debug}
        <p class="truncate font-mono">
            value = {JSON.stringify(media.screen_maxHeight)}
        </p>
    {/if}
</div>
