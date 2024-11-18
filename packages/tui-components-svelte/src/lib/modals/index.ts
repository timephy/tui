import { getContext, type Snippet } from "svelte"
import { MODAL_KEY, MODAL_CONTROLLER_KEY, type ComponentWithProps } from "./internal"

export type ModalOptions = {
    id?: string
}

/** The context object available through `getModalController()` to add/remove modals. */
export type ModalController = {
    push<Props extends Record<string, unknown>>(view: Snippet | ComponentWithProps<Props>, options?: ModalOptions): void
    pop(): void
    popAll(): void
    remove(id: string): void
    readonly count: number
}

/**
 * Call this function from a child of `ModalController` to get the ModalControllerContext.
 */
export function getModalController() {
    const context = getContext(MODAL_CONTROLLER_KEY)
    if (context === undefined) throw new Error("No ModalViewControllerContext found")
    return context as ModalController
}

/* ================================================================================================================== */

/** The context object available through `getModal()` to control the current modal. */
export type Modal = {
    /** The identifier of the modal. */
    readonly id: string
    /** If the modal is currently the top modal and therefore visible. */
    readonly topMost: boolean
    /** if the modal is the bottom most modal. */
    readonly bottomMost: boolean
    /** Close the modal. */
    close(): void
    /** Whether the modal is fullscreen. */
    fullscreen: boolean
    /** Whether the modal should close when the escape key is pressed. */
    escClose: boolean
}

/**
 * Call this function from a child of `Modal` to get the ModalContext.
 */
export function getModal() {
    const context = getContext(MODAL_KEY)
    if (context === undefined) throw new Error("No ModalContext found")
    return context as Modal
}
