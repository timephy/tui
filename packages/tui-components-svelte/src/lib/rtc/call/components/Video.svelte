<!--
    @component
    A video element for displaying a MediaStream.
-->

<script lang="ts">
    let elem: HTMLVideoElement

    let {
        stream,
        muted,
        class: CLASS,
    }: {
        stream: MediaStream | null
        muted: boolean
        class?: string
    } = $props()

    $effect(() => {
        elem.srcObject = stream
    })
</script>

<!-- svelte-ignore a11y_media_has_caption -->
<video bind:this={elem} {muted} autoplay playsinline controls={false} class={CLASS}></video>
