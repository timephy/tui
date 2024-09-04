<script lang="ts">
    import { Field } from "$lib/storage/index.svelte"
    import Switch from "$lib/ui/Switch.svelte"
    import { onMount } from "svelte"

    const field = new Field("page", false, Field.parse_boolean)

    $inspect(field.value)

    let loading = $state(false)
    onMount(() => {
        loading = false
    })
</script>

{#if loading}
    Loading...
{:else}
    <Switch bind:value={field.value} />
{/if}
