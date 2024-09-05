<script lang="ts">
    import Storage from "$lib/storage/index.svelte"
    import Switch from "$lib/ui/Switch.svelte"

    const field = Storage.boolean("page", false)

    $inspect(field.value)
</script>

<Switch bind:value={field.value} />
