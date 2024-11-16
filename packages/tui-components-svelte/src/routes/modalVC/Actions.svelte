<script lang="ts">
    import { getModalViewControllerContext } from "$lib/modal/ModalViewController.svelte"
    import ModalFullscreen from "./ModalFullscreen.svelte"
    import ModalSmall from "./ModalSmall.svelte"

    const MODALVC = getModalViewControllerContext()
</script>

{#snippet A()}
    <p>Snippet A</p>
{/snippet}

{#snippet FullscreenA()}
    <ModalFullscreen>
        {@render A()}
    </ModalFullscreen>
{/snippet}

{#snippet SmallA()}
    <ModalSmall a={1}>
        {@render A()}
    </ModalSmall>
{/snippet}

<div class="grid w-96 grid-cols-2 gap-2">
    <button class="btn btn-p btn-tall btn-blue" onclick={() => MODALVC.push(FullscreenA)}>push FullscreenA</button>
    <button
        class="btn btn-p btn-tall btn-blue"
        onclick={() => {
            MODALVC.push({
                component: ModalSmall,
                props: { children: A, a: 1 },
            })
        }}
    >
        push SmallA
    </button>
</div>
