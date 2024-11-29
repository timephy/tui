import { getContext, type Snippet } from "svelte"
import { MODAL_KEY, MODAL_CONTROLLER_KEY, type ComponentWithProps } from "./internal"

export type ModalOptions = {
    /**
     * Set a custom id for the modal. If not set, a random id will be generated.
     *
     * Useful to remove a specific modal with `remove(id)`.
     */
    id?: string
    /**
     * A callback that is called when the modal is closed.
     */
    onClosed?: () => void
}

/** The context object available through `getModalController()` to add/remove modals. */
export type ModalController = {
    readonly push: <Props extends Record<string, unknown>>(
        view: Snippet | ComponentWithProps<Props>,
        options?: ModalOptions,
    ) => void
    readonly pop: () => void
    readonly popAll: () => void
    readonly closeById: (id: string) => void
    readonly count: number
}

/**
 * Call this function from a child of `ModalController` to get the ModalControllerContext.
 */
export function getModalController() {
    const context = getContext(MODAL_CONTROLLER_KEY)
    if (context === undefined) throw new Error("No ModalController context found")
    return context as ModalController
}

/* ================================================================================================================== */

export type ModalConfig = {
    /** Whether the modal should be rendered when it is not `topMost`. */
    renderInBackground: boolean
    /** Whether the modal should close when the escape key is pressed. */
    closeOnEsc: boolean
    /** Whether the modal should close when clicking outside of it. */
    closeOnOutsideClick: boolean

    /** Whether the modal should actually close when close() is triggered. */
    onClose: (() => boolean | Promise<boolean>) | null
}

/** The context object available through `getModal()` to control the current modal. */
export type Modal = {
    /** The identifier of the modal. */
    readonly id: string
    /** If the modal is currently the top modal and therefore visible. */
    readonly topMost: boolean
    /** if the modal is the bottom most modal. */
    readonly bottomMost: boolean
    /** Close the modal. */
    readonly close: () => void
} & ModalConfig

/**
 * Call this function from a child of `Modal` to get the ModalContext.
 */
export function getModal() {
    const context = getContext(MODAL_KEY)
    if (context === undefined) throw new Error("No Modal context found")
    return context as Modal
}
