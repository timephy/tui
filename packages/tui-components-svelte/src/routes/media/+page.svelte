<script lang="ts">
    import { page } from "$app/stores"
    import Video from "$lib/call/ui/Video.svelte"
    import { Media, mediaState$ as _mediaState$ } from "$lib/media"
    import MediaControls from "$lib/media/ui/MediaControls.svelte"
    import MediaState from "$lib/media/ui/MediaState.svelte"
    import MediaSelect from "$lib/media/ui/settings/MediaSettingsSelect.svelte"
    import MediaVolume from "$lib/media/ui/settings/MediaSettingsVolume.svelte"
    import { onDestroy, onMount } from "svelte"

    /* ========================================================================================== */

    const debug = $page.url.searchParams.get("debug") !== null

    /* ========================================================================================== */

    const media = new Media()

    onDestroy(async () => {
        await media.destroy()
    })

    const mediaState$ = _mediaState$(media)

    /* ========================================================================================== */

    let key = $state({})
    onMount(() => {
        const interval = setInterval(() => {
            key = {}
        }, 100)
        return () => clearInterval(interval)
    })
</script>

<div class="flex min-h-full justify-between gap-6 p-6">
    <!-- !! Center Column -->
    <div class="flex w-full max-w-sm flex-col gap-6">
        <!-- !! Local -->
        <div class="card card-p flex flex-col gap-2">
            <div class="section flex flex-row items-center justify-between gap-4">
                <h1>local</h1>
                <MediaState mediaState={$mediaState$} {debug} />
            </div>
            {#if media.cam_video}
                <Video
                    stream={new MediaStream([media.cam_video])}
                    muted={true}
                    class="item box-content -scale-x-100 bg-step-base"
                />
            {/if}
            {#if media.screen_video}
                <Video
                    stream={new MediaStream([media.screen_video])}
                    muted={true}
                    class="item box-content bg-step-base"
                />
            {/if}
            <div></div>
            <div class="grid grid-cols-4 gap-2">
                <MediaControls {media} />
            </div>
            {#if debug}
                <div></div>
                {#key key}
                    <div class="note grid grid-cols-2 px-1.5 [&>*:nth-child(even)]:text-right [&>*]:truncate">
                        <div>mic</div>
                        <div>
                            {JSON.stringify(media.mic_audioSource?.label) ?? "undefined"}
                        </div>
                        <div>cam</div>
                        <div>{JSON.stringify(media.cam_video?.label) ?? "undefined"}</div>
                        <div>screen</div>
                        <div>
                            {JSON.stringify(media.screen_video?.label) ?? "undefined"}
                        </div>
                        <div>screen_audio</div>
                        <div>
                            {JSON.stringify(media.screen_audio?.label) ?? "undefined"}
                        </div>
                        <div>&nbsp;</div>
                        <div>&nbsp;</div>
                        <div>mute: {JSON.stringify(media.mute)}</div>
                        <div>&nbsp;</div>
                        <div>deaf: {JSON.stringify(media.deaf)}</div>
                        <div>&nbsp;</div>
                        <div>&nbsp;</div>
                        <div>&nbsp;</div>
                        <div>mic_active: {JSON.stringify(media.mic_active)}</div>
                        <div class="!text-left">
                            mic_error: {JSON.stringify(media.mic_error)}
                        </div>
                        <div>cam_active: {JSON.stringify(media.cam_active)}</div>
                        <div class="!text-left">
                            cam_error: {JSON.stringify(media.cam_error)}
                        </div>
                        <div>screen_active: {JSON.stringify(media.screen_active)}</div>
                        <div class="!text-left">
                            screen_error: {JSON.stringify(media.screen_error)}
                        </div>
                    </div>
                {/key}
            {/if}
        </div>
    </div>

    <!-- !! Right Column -->
    <div class="flex w-full max-w-sm flex-col gap-6">
        <div class="card card-p w-full">
            <MediaSelect {media} {debug} />
        </div>
        <div class="card card-p w-full">
            <MediaVolume {media} {debug} />
        </div>
    </div>
</div>
