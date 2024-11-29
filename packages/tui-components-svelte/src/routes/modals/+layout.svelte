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

    setTimeout(() => {
        defaultConfig.closeOnEsc = false
        console.log(defaultConfig)
    }, 5000)
</script>

<ModalViewController {defaultConfig}>
    {@render children()}
</ModalViewController>
