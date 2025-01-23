<!--
    @component
    Settings for media input (microphone, camera, and screen resolution).
-->

<script lang="ts" module>
    export type MicCam<T> = {
        mic: T
        cam: T
    }
    export type All<T> = {
        mic: T
        cam: T
        screen: T
    }
</script>

<script lang="ts">
    import Select from "$lib/ui/Select.svelte"
    import display from "@timephy/tui-icons-svelte/display"
    import type { Snippet } from "svelte"
    import { type Media } from "../../Media.svelte"
    import { RESOLUTIONS } from "../../shared"
    import SelectCam from "./select/SelectCam.svelte"
    import SelectMic from "./select/SelectMic.svelte"

    let {
        media,
        debug = false,
        titles = {
            mic: "Microphone",
            cam: "Camera",
            screen: "Screen Resolution",
        },
        selectSnippet = {
            mic: mic_select_default,
            cam: cam_select_default,
            screen: screen_select_default,
        },
        errorSnippet = {
            mic: mic_error_default,
            cam: cam_error_default,
        },
    }: {
        media: Media
        debug?: boolean
        titles?: All<string | null>
        selectSnippet?: All<Snippet>
        errorSnippet?: MicCam<Snippet>
    } = $props()
</script>

{#snippet mic_select_default()}
    <p>Select a microphone to use.</p>
{/snippet}
{#snippet mic_error_default()}
    <p class="!text-red">Allow access in browser settings.</p>
{/snippet}

{#snippet cam_select_default()}
    <p>Select a camera to use.</p>
{/snippet}
{#snippet cam_error_default()}
    <p class="!text-red">Allow access in browser settings.</p>
{/snippet}

{#snippet screen_select_default()}
    <p>Limit your screen resolution for more fps.</p>
{/snippet}

<div class="section gap-3">
    <!-- ! Mic -->
    <div class="section">
        {#if titles.mic}
            <h3>{titles.mic}</h3>
        {/if}

        <SelectMic {media} />

        <!-- NOTE: Check for device list too, because in Safari permissions are not updated -->
        {#if media.mic_permission !== "granted" && media.mic_error !== null && media.mic_devices.length === 0}
            {@render errorSnippet.mic()}
        {:else if media.mic_id === null}
            {@render selectSnippet.mic()}
        {/if}

        {#if debug}
            <p class="truncate font-mono">
                value = {JSON.stringify(media.mic_id)}
                <br />
                permission = {JSON.stringify(media.mic_permission)}
            </p>
        {/if}
    </div>

    <!-- ! Cam -->
    <div class="section">
        {#if titles.cam}
            <h3>{titles.cam}</h3>
        {/if}

        <SelectCam {media} />

        <!-- NOTE: Check for device list too, because in Safari permissions are not updated -->
        {#if media.cam_permission !== "granted" && media.cam_error !== null && media.cam_devices.length === 0}
            {@render errorSnippet.cam()}
        {:else if media.cam_id === null}
            {@render selectSnippet.cam()}
        {/if}

        {#if debug}
            <p class="truncate font-mono">
                value = {JSON.stringify(media.cam_id)}
                <br />
                permission = {JSON.stringify(media.cam_permission)}
            </p>
        {/if}
    </div>

    <!-- ! Screen -->
    <div class="section">
        {#if titles.screen}
            <h3>{titles.screen}</h3>
        {/if}

        <Select bind:value={media.screen_maxHeight} options={RESOLUTIONS} icon={display} />

        {@render selectSnippet.screen()}

        {#if debug}
            <p class="truncate font-mono">
                value = {JSON.stringify(media.screen_maxHeight)}
            </p>
        {/if}
    </div>
</div>
