<script lang="ts">
    import ModalViewController from "$lib/modals/ModalViewController.svelte"
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
