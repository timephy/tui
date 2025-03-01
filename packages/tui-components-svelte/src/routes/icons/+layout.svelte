<script lang="ts">
    import ModalViewController from "$lib/modals/ModalViewController.svelte"
    import type { Snippet } from "svelte"

    const {
        children,
    }: {
        children: Snippet
    } = $props()

    const defaultConfig = $state({
        closeOnEsc: true,
        closeOnOutsideClick: true,
        renderInBackground: false,
        onClose: null,
    })
</script>

<ModalViewController {defaultConfig}>
    <div class="h-full w-full overflow-y-auto">
        {@render children()}
    </div>
</ModalViewController>
