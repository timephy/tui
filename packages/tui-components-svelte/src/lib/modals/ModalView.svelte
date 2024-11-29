<script lang="ts">
    import { setContext, type Snippet } from "svelte"
    import type { Modal, ModalConfig } from "."
    import { MODAL_KEY } from "./internal"

    const {
        defaultConfig,
        id,
        topMost,
        bottomMost,
        close: _close,
        children,
    }: {
        defaultConfig: ModalConfig
        id: string
        topMost: boolean
        bottomMost: boolean
        close: () => void
        children: Snippet
    } = $props()

    /* ============================================================================================================== */

    const config: Partial<ModalConfig> = $state({
        closeOnEsc: undefined,
        closeOnOutsideClick: undefined,
        renderInBackground: undefined,
        onClose: undefined,
    })

    /* ============================================================================================================== */

    const MODAL: Modal = {
        // Passthrough props (from controller)
        get id() {
            return id
        },
        get topMost() {
            return topMost
        },
        get bottomMost() {
            return bottomMost
        },
        async close() {
            const onClose = config.onClose ?? defaultConfig.onClose
            // INFO: if onClose returns false, do not close the modal
            if (onClose !== null && (await onClose()) !== true) return
            _close()
        },
        // Modal config
        get renderInBackground() {
            return config.renderInBackground ?? defaultConfig.renderInBackground
        },
        set renderInBackground(renderInBackground) {
            config.renderInBackground = renderInBackground
        },
        get closeOnEsc() {
            return config.closeOnEsc ?? defaultConfig.closeOnEsc
        },
        set closeOnEsc(closeOnEsc) {
            config.closeOnEsc = closeOnEsc
        },
        get closeOnOutsideClick() {
            return config.closeOnOutsideClick ?? defaultConfig.closeOnOutsideClick
        },
        set closeOnOutsideClick(closeOnOutsideClick) {
            config.closeOnOutsideClick = closeOnOutsideClick
        },
        get onClose() {
            return config.onClose ?? defaultConfig.onClose
        },
        set onClose(onClose) {
            config.onClose = onClose
        },
    }
    setContext(MODAL_KEY, MODAL)

    /* ============================================================================================================== */

    const window_onkeydown = (e: KeyboardEvent) => {
        // only the top most modal should close on `esc` press
        if (!MODAL.topMost) return
        // ignore if closeOnEsc is disabled
        if (!MODAL.closeOnEsc) return

        if (e.key === "Escape") {
            MODAL.close()
            // NOTE: blur the active element so not to select the button leading to the modal on `esc` press
            ;(document.activeElement as HTMLElement).blur()
        }
    }

    const background_onclick = (e: MouseEvent) => {
        // ignore if closeOnOutsideClick is disabled
        if (!MODAL.closeOnOutsideClick) return

        // NOTE: close the modal only if the click is on the background, not on children
        if (e.target === e.currentTarget) {
            MODAL.close()
        }
    }
</script>

<svelte:window onkeydown={window_onkeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    id="ModalView"
    class="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
    style:display={topMost || MODAL.renderInBackground ? "" : "none"}
    ontouchmove={(e) => e.stopPropagation()}
    onclick={background_onclick}
>
    {@render children()}
</div>
