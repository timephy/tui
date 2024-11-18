<script lang="ts">
    import { getTab } from "$lib/tabs"

    const tab = getTab()

    let i = $state(0)

    tab.onSelected(() => {
        console.log("onSelect")
        i++
    })
</script>

<div class="flex h-[110%] flex-col items-center justify-center bg-red/10">
    <p>Settings {i}</p>
</div>
