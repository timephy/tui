<script lang="ts">
    import { DerivedState } from "$lib/runes/index.svelte"

    let x = $state(0)

    const y: number = $derived.by(
        DerivedState({
            construct: (curr) => {
                console.log("construct", curr)
                return (curr ?? 0) + x
            },
            destruct: (curr) => console.log("destruct", curr),
        }),
    )
</script>

<button
    onclick={() => {
        x++
    }}>Increment X</button
>

<br />
x = {x}
<br />
y = {y}
