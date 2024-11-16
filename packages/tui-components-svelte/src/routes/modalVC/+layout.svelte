<script lang="ts">
    import ModalViewController from "$lib/modal/ModalViewController.svelte"
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
