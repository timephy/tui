<script lang="ts">
    import { getModalContext } from "$lib/modal/ModalView.svelte"

    const MODAL = getModalContext<{ title: string }>()
</script>

<button class="btn btn-p btn-tall btn-red" onclick={() => MODAL.close()}>close</button>

<div class="item item-p flex flex-col gap-2">
    <p>Header</p>
    <p>id: {MODAL.id}</p>
    <p>showing: {MODAL.topMost}</p>
    <p>fullscreen: {MODAL.viewOptions.fullscreen}</p>
    <p>escClose: {MODAL.viewOptions.escClose}</p>
    <p>title: {MODAL.dict.title}</p>
</div>
