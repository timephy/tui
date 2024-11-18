<script lang="ts">
    import type { Snippet } from "svelte"
    import Header from "./Header.svelte"
    import Actions from "./Actions.svelte"
    import { getModal } from "$lib/modals"

    const {
        children,
        a: _a,
    }: {
        children: Snippet
        a: number
    } = $props()

    const MODAL = getModal()
</script>

<div class="card card-p">
    <Header />
    {@render children()}
    <Actions />
    <button
        onclick={() => {
            MODAL.fullscreen = true
            MODAL.escClose = false
        }}
    >
        ASD</button
    >
</div>
