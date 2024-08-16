<script lang="ts">
    import { page } from "$app/stores"
    import CallControls from "$lib/call/ui/CallControls.svelte"
    import MediaState from "$lib/media/ui/MediaState.svelte"
    import MediaSelect from "$lib/media/ui/settings/MediaSettingsSelect.svelte"
    import MediaVolume from "$lib/media/ui/settings/MediaSettingsVolume.svelte"
    import Video from "$lib/call/ui/Video.svelte"
    import DebugPeer from "$lib/call/ui/debug/DebugPeer.svelte"
    import { MeshCallClientDemo } from "$lib/examples/call/MeshCallClientDemo.svelte"
    import { onDestroy, onMount } from "svelte"
    import PeerOptions from "$lib/call/ui/PeerOptions.svelte"

    /* ========================================================================================== */

    const roomId = $page.params["roomId"]
    // const userId = $page.url.searchParams.get("userId") ?? Math.random().toString(36).slice(2)
    const debug = $page.url.searchParams.get("debug") !== null

    /* ========================================================================================== */

    const host = $page.url.host
    const protocol = $page.url.protocol === "https:" ? "wss:" : "ws:"
    const server = `${protocol}//${host}`

    /* ========================================================================================== */

    const call = new MeshCallClientDemo(server, roomId)

    onDestroy(async () => {
        await call.destroy()
    })

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
    <!-- !! Left Column -->
    <div class="flex w-full max-w-sm flex-col gap-6">
        <div class="card card-p section flex flex-col gap-2">
            <h1>List Clients in Room</h1>
            {#each call.clientsState ?? [] as clientId}
                <div class="item item-p">{clientId}</div>
            {/each}
        </div>
        <div class="card card-p section flex flex-col gap-2">
            <h1>List Clients in Call</h1>
            {#if call.callState?.size}
                {#each [...call.callState] as [peerId, mediaState]}
                    {@const _mediaState = mediaState}
                    <div class="item item-p flex items-center justify-between gap-4">
                        <p class="note truncate">{peerId}</p>
                        {#if mediaState}
                            <MediaState mediaState={_mediaState} {debug} />
                        {/if}
                    </div>
                {/each}
            {:else}
                <div class="item item-p px-4 text-sm text-step-500">No one connected</div>
            {/if}
        </div>
    </div>

    <!-- !! Center Column -->
    <div class="flex w-full max-w-sm flex-col gap-6">
        <!--  -->
        <!-- !! Peers -->
        {#each call.peers as [_, p]}
            <div class="card card-p section">
                {#if debug}
                    <DebugPeer peer={p} />
                {:else}
                    <div class="section flex flex-row items-center justify-between gap-4">
                        <h1 class="truncate">{p._debug_id}</h1>
                        <MediaState mediaState={p.mediaState} />
                    </div>

                    {#if p.mediaState.cam}
                        <Video
                            stream={p.micCamStream}
                            muted={true}
                            class="item box-content bg-step-base"
                        />
                    {/if}
                    {#if p.mediaState.screen}
                        <Video
                            stream={p.screenStream}
                            muted={false}
                            class="item box-content bg-step-base"
                        />
                    {/if}

                    <hr />

                    <PeerOptions peer={p} />
                {/if}
            </div>
        {/each}

        <!-- !! Local -->
        <div class="card card-p flex flex-col gap-2">
            <div class="section flex flex-row items-center justify-between gap-4">
                <h1>local</h1>
                <MediaState mediaState={call.local.mediaState} {debug} />
            </div>
            {#if call.media.cam_video}
                <Video
                    stream={new MediaStream([call.media.cam_video])}
                    muted={true}
                    class="item box-content -scale-x-100 bg-step-base"
                />
            {/if}
            {#if call.media.screen_video}
                <Video
                    stream={new MediaStream([call.media.screen_video])}
                    muted={true}
                    class="item box-content bg-step-base"
                />
            {/if}
            <div></div>
            <CallControls
                {call}
                layout="normal"
                showMediaSettings={() => {}}
                joinCallText="Join Call"
            />
            {#if debug}
                <div></div>
                {#key key}
                    <div
                        class="note grid grid-cols-2 px-1.5 [&>*:nth-child(even)]:text-right [&>*]:truncate"
                    >
                        <div>mic</div>
                        <div>
                            {JSON.stringify(call.media.mic_audioSource?.label) ?? "undefined"}
                        </div>
                        <div>cam</div>
                        <div>{JSON.stringify(call.media.cam_video?.label) ?? "undefined"}</div>
                        <div>screen</div>
                        <div>
                            {JSON.stringify(call.media.screen_video?.label) ?? "undefined"}
                        </div>
                        <div>screen_audio</div>
                        <div>
                            {JSON.stringify(call.media.screen_audio?.label) ?? "undefined"}
                        </div>
                        <div>&nbsp;</div>
                        <div>&nbsp;</div>
                        <div>mute: {JSON.stringify(call.media.mute)}</div>
                        <div>&nbsp;</div>
                        <div>deaf: {JSON.stringify(call.media.deaf)}</div>
                        <div>&nbsp;</div>
                        <div>&nbsp;</div>
                        <div>&nbsp;</div>
                        <div>mic_active: {JSON.stringify(call.media.mic_active)}</div>
                        <div class="!text-left">
                            mic_error: {JSON.stringify(call.media.mic_error)}
                        </div>
                        <div>cam_active: {JSON.stringify(call.media.cam_active)}</div>
                        <div class="!text-left">
                            cam_error: {JSON.stringify(call.media.cam_error)}
                        </div>
                        <div>screen_active: {JSON.stringify(call.media.screen_active)}</div>
                        <div class="!text-left">
                            screen_error: {JSON.stringify(call.media.screen_error)}
                        </div>
                    </div>
                {/key}
            {/if}
        </div>
    </div>

    <!-- !! Right Column -->
    <div class="flex w-full max-w-sm flex-col gap-6">
        <div class="card card-p w-full">
            <MediaSelect media={call.media} {debug} />
        </div>
        <div class="card card-p w-full">
            <MediaVolume media={call.media} {debug} />
        </div>
    </div>
</div>

<!-- !! Vertically Second Page -->
<!-- {#if debug}
    <p>server: {server}</p>
    {#key key}
        <p>socket.connected: {call.socket.connected}</p>
        <p>socket.disconnected: {call.socket.disconnected}</p>
        <p>socket.id: {call.socket.id}</p>
    {/key}
    {#each call.messages as msg}
        <p class="note">{msg.sender}: {JSON.stringify(msg.message)}</p>
        <br />
    {/each}
{/if} -->
