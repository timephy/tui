<!--
    @component
    A controller for managing modals.

    Wrap your app in this component in your root `+page.svelte` to enable modals.

    @example
    ```svelte
    <script lang="ts">
        import ModalViewController from "@timui/modals"
        import type { Snippet } from "svelte"

        const {
            children,
        }: {
            children: Snippet
        } = $props()
    </script>

    <ModalViewController>
        {@render children()}
    </ModalViewController>
    ```

    And then inside your app, you can use access the ModalController:

    ```svelte
    <script lang="ts">
        import { getModalController } from "@timui/modals"

        const MODAL_C = getModalController()

        // push a new modal using a snippet
        MODAL_C.push(snippet)
        // push a new modal using a component with props
        MODAL_C.push({
            component: MyModal,
            props: { title: "Hello" },
        })

        // pop the top most modal
        MODAL_C.pop()
        // pop all modals
        MODAL_C.popAll()

        // remove a specific modal
        MODAL_C.remove("modal-id")

        // get the number of modals
        console.log(MODAL_C.count)
    </script>
    ```

    And to access the current modal:

    ```svelte
    <script lang="ts">
        import { getModal } from "@timui/modals"

        const MODAL = getModal()

        // configure the modal
        MODAL.fullscreen = true
        MODAL.escClose = false
        MODAL.data = { key: "value" } // { title: "Hello" }

        // close the modal
        MODAL.close()
    </script>
    ```
-->

<script lang="ts">
    import { setContext, type Snippet } from "svelte"
    import { MODAL_CONTROLLER_KEY, type ComponentWithProps } from "./internal"
    import ModalView from "./ModalView.svelte"
    import type { ModalController } from "."

    /* ==================================================== Props =================================================== */

    const {
        children,
    }: {
        children: Snippet
    } = $props()

    /* ==================================================== State =================================================== */

    type Modal = {
        id: string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        view: Snippet | ComponentWithProps<any>
    }
    let modals: Modal[] = $state([])

    /* =================================================== Context ================================================== */

    const MODAL_C: ModalController = {
        push(view, options) {
            const id = options?.id ?? Math.random().toString(36).substring(7)
            modals.push({ view, id })
        },
        pop() {
            modals.pop()
        },
        popAll() {
            modals = []
        },
        remove(id) {
            modals = modals.filter((modal) => modal.id !== id)
        },
        get count() {
            return modals.length
        },
    }
    setContext(MODAL_CONTROLLER_KEY, MODAL_C)

    /* =================================================== Effects ================================================== */

    // on desktop this hides the scrollbar, disabling scrolling alltogether
    $effect(() => {
        if (modals.length > 0) {
            document.body.classList.add("overflow-hidden")
        } else {
            document.body.classList.remove("overflow-hidden")
        }
    })
</script>

<div id="ModalViewController" class="relative h-full w-full">
    <!-- NOTE: Key `modal.id` to reuse components -->
    {#each modals as modal, i (modal.id)}
        <ModalView
            id={modal.id}
            topMost={i === modals.length - 1}
            bottomMost={i === 0}
            close={() => MODAL_C.remove(modal.id)}
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
