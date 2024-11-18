<script lang="ts">
    import type { Snippet } from "svelte"
    import Header from "./Header.svelte"
    import Actions from "./Actions.svelte"
    import { getModal } from "$lib/modals"

    const {
        children,
    }: {
        children: Snippet
    } = $props()

    const MODAL = getModal()
    MODAL.fullscreen = true
    MODAL.escClose = false
</script>

<div class="h-full w-full bg-red/50">
    <Header />
    {@render children()}
    <Actions />
</div>
