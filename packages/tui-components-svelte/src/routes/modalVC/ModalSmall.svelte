<script lang="ts">
    import type { Snippet } from "svelte"
    import Header from "./Header.svelte"
    import Actions from "./Actions.svelte"
    import { getModalContext } from "$lib/modal/ModalView.svelte"

    const {
        children,
        a: _a,
    }: {
        children: Snippet
        a: number
    } = $props()

    const MODAL = getModalContext<{ title: string }>()
</script>

<div class="card card-p">
    <Header />
    {@render children()}
    <Actions />
    <button
        onclick={() => {
            MODAL.dict.title = "ASD"
            MODAL.viewOptions.fullscreen = true
            MODAL.viewOptions.escClose = false
        }}
    >
        ASD</button
    >
</div>
