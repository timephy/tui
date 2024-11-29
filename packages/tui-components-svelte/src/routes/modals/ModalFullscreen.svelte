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
    MODAL.renderInBackground = true
    MODAL.closeOnEsc = false
</script>

<div class="h-full w-full bg-red/25">
    <Header />
    {@render children()}
    <Actions />
</div>
