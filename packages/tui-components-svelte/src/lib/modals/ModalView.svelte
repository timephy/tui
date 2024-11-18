<script lang="ts">
    import { setContext, type Snippet } from "svelte"
    import type { Modal } from "."
    import { MODAL_KEY } from "./internal"

    const {
        id,
        topMost,
        bottomMost,
        close,
        children,
    }: {
        id: string
        topMost: boolean
        bottomMost: boolean
        close: () => void
        children: Snippet
    } = $props()

    /* ============================================================================================================== */

    let _fullscreen = $state(false)
    let _escClose = $state(true)

    /* ============================================================================================================== */

    const MODAL: Modal = {
        get id() {
            return id
        },
        get topMost() {
            return topMost
        },
        get bottomMost() {
            return bottomMost
        },
        close,
        get fullscreen() {
            return _fullscreen
        },
        set fullscreen(fullscreen) {
            _fullscreen = fullscreen
        },
        get escClose() {
            return _escClose
        },
        set escClose(escClose) {
            _escClose = escClose
        },
    }
    setContext(MODAL_KEY, MODAL)

    /* ============================================================================================================== */

    const onkeydown = (e: KeyboardEvent) => {
        if (topMost && _escClose && e.key === "Escape") {
            MODAL.close()
        }
    }
</script>

<svelte:window {onkeydown} />

<div
    id="ModalView"
    class="absolute inset-0 z-40 flex flex-col items-center justify-center
        bg-black/75 backdrop-blur-sm transition-opacity duration-300"
    style:display={topMost || _fullscreen ? "" : "none"}
    ontouchmove={(e) => e.stopPropagation()}
>
    {@render children()}
</div>
