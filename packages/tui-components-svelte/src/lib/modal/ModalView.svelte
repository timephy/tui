<script lang="ts" module>
    import { getContext, setContext, type Snippet } from "svelte"

    export type ModalViewOptions = {
        /** Whether the modal is fullscreen. */
        fullscreen: boolean
        /** Whether the modal should close when the escape key is pressed. */
        escClose: boolean
    }

    const MODAL_CONTEXT = "tui.modal"
    export type ModalContext<D extends Record<string, unknown>> = {
        /** The identifier of the modal. */
        readonly id: string
        /** If the modal is currently the top modal and therefore visible. */
        readonly topMost: boolean
        /** if the modal is the bottom most modal. */
        readonly bottomMost: boolean
        /** Close the modal. */
        close(): void
        viewOptions: ModalViewOptions
        dict: D
    }

    /**
     * Call this function from a child of `ModalView` to get the ModalContext.
     */
    export function getModalContext<D extends Record<string, unknown>>() {
        const context = getContext(MODAL_CONTEXT)
        if (context === undefined) throw new Error("No ModalContext found")
        return context as ModalContext<D>
    }
</script>

<script lang="ts">
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

    let _viewOptions: ModalViewOptions = $state({
        fullscreen: false,
        escClose: true,
    })
    let _dict: Record<string, unknown> = $state({})

    /* ============================================================================================================== */

    const context: ModalContext<Record<string, unknown>> = {
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
        get viewOptions() {
            return _viewOptions
        },
        set viewOptions(viewOptions) {
            _viewOptions = viewOptions
        },
        get dict() {
            return _dict
        },
        set dict(dict) {
            _dict = dict
        },
    }
    setContext(MODAL_CONTEXT, context)

    /* ============================================================================================================== */

    const onkeydown = (e: KeyboardEvent) => {
        if (topMost && _viewOptions.escClose && e.key === "Escape") {
            context.close()
        }
    }
</script>

<svelte:window {onkeydown} />

<div
    id="ModalView"
    class="absolute inset-0 z-40 flex flex-col items-center justify-center
        bg-black/75 backdrop-blur-sm transition-opacity duration-300"
    style:display={topMost || _viewOptions.fullscreen ? "" : "none"}
    ontouchmove={(e) => e.stopPropagation()}
>
    {@render children()}
</div>
