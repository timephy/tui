<script lang="ts">
    import { getTabContext } from "$lib/tabs/TabView.svelte"

    const tab = getTabContext()

    let i = $state(0)

    tab.onSelected(() => {
        console.log("onSelect")
        i++
    })
</script>

<div class="flex h-[110%] flex-col items-center justify-center bg-red/10">
    <p>Settings {i}</p>
</div>
