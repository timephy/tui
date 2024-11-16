<script lang="ts" module>
    const MODAL_VIEW_CONTROLLER_CONTEXT = "tui.modalViewController"
    export type ComponentWithProps<Props extends Record<string, unknown>> = {
        component: Component<Props>
        props: Props
    }
    export type ModalViewControllerContext = {
        push<Props extends Record<string, unknown>>(
            view: Snippet | ComponentWithProps<Props>,
            options?: ModalOptions,
        ): void
        pop(): void
        popToRoot(): void
        remove(id: string): void
    }

    /**
     * Call this function from a child of `ModalViewController` to get the ModalViewControllerContext.
     */
    export function getModalViewControllerContext() {
        const context = getContext(MODAL_VIEW_CONTROLLER_CONTEXT)
        if (context === undefined) throw new Error("No ModalViewControllerContext found")
        return context as ModalViewControllerContext
    }

    /* ============================================================================================================== */

    export type ModalOptions = {
        id?: string
    }
    type Modal = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        view: Snippet | ComponentWithProps<any>
        id: string
    }
</script>

<script lang="ts">
    import { getContext, setContext, type Component, type Snippet } from "svelte"
    import ModalView from "./ModalView.svelte"

    const {
        children,
    }: {
        children: Snippet
    } = $props()

    let modals: Modal[] = $state([])

    // on desktop this hides the scrollbar, disabling scrolling alltogether
    $effect(() => {
        if (modals.length > 0) {
            document.body.classList.add("overflow-hidden")
        } else {
            document.body.classList.remove("overflow-hidden")
        }
    })

    /* ============================================================================================================== */

    const MODALVC: ModalViewControllerContext = {
        push(view, options) {
            const id = options?.id ?? Math.random().toString(36).substring(7)
            modals.push({ view, id })
        },
        pop() {
            modals.pop()
        },
        popToRoot() {
            modals = []
        },
        remove(id) {
            modals = modals.filter((modal) => modal.id !== id)
        },
    }
    setContext(MODAL_VIEW_CONTROLLER_CONTEXT, MODALVC)
</script>

<div id="ModalViewController" class="relative h-full w-full">
    <!-- NOTE: Key `modal.id` to reuse components -->
    {#each modals as modal, i (modal.id)}
        <ModalView
            id={modal.id}
            topMost={i === modals.length - 1}
            bottomMost={i === 0}
            close={() => MODALVC.remove(modal.id)}
        >
            {#if modal.view instanceof Function}
                {@render modal.view()}
            {:else}
                <modal.view.component {...modal.view.props} />
            {/if}
        </ModalView>
    {/each}

    <!-- NOTE: Render normal children here -->
    {@render children()}
</div>
