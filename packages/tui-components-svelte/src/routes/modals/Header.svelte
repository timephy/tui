<script lang="ts">
    import { getModal } from "$lib/modals"

    const MODAL = getModal()
</script>

<button class="btn btn-p btn-tall btn-red" onclick={() => MODAL.close()}>close</button>

<div class="item item-p flex flex-col gap-2">
    <p>Header</p>
    <p class="font-mono">
        id = {MODAL.id}
        <br />
        topMost = {MODAL.topMost}
        <br />
        bottomMost = {MODAL.bottomMost}
        <br />
        renderInBackground = {MODAL.renderInBackground}
        <br />
        closeOnEsc = {MODAL.closeOnEsc}
        <br />
        closeOnOutsideClick = {MODAL.closeOnOutsideClick}
        <br />
    </p>
</div>
