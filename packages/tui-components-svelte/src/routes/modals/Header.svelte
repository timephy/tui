<script lang="ts">
    import { getModal } from "$lib/modals"

    const MODAL = getModal()
</script>

<button class="btn btn-p btn-tall btn-red" onclick={() => MODAL.close()}>close</button>

<div class="item item-p flex flex-col gap-2">
    <p>Header</p>
    <p>id: {MODAL.id}</p>
    <p>showing: {MODAL.topMost}</p>
    <p>fullscreen: {MODAL.fullscreen}</p>
    <p>escClose: {MODAL.escClose}</p>
</div>
