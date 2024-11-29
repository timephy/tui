<script lang="ts">
    import type { Snippet } from "svelte"
    import Header from "./Header.svelte"
    import Actions from "./Actions.svelte"

    const {
        children,
        a: _a,
    }: {
        children: Snippet
        a: number
    } = $props()
</script>

<div class="card card-p">
    <Header />
    {@render children()}
    <Actions />
</div>
