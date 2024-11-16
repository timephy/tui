<script lang="ts">
    import type { Snippet } from "svelte"
    import Header from "./Header.svelte"
    import Actions from "./Actions.svelte"
    import { getModalContext } from "$lib/modal/ModalView.svelte"

    const {
        children,
    }: {
        children: Snippet
    } = $props()

    const MODAL = getModalContext()
    MODAL.viewOptions.fullscreen = true
    MODAL.viewOptions.escClose = false

    MODAL.dict.title = "Fullscreen"
</script>

<div class="h-full w-full bg-red/50">
    <Header />
    {@render children()}
    <Actions />
</div>
