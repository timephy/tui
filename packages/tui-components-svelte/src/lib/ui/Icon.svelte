<script lang="ts" context="module">
    export type { IconType } from "svelte-awesome/components/Icon.svelte"
</script>

<script lang="ts">
    import type { ComponentProps } from "svelte"
    import Icon from "svelte-awesome/components/Icon.svelte"

    /* ========================================================================================== */
    /*                                            Props                                           */
    /* ========================================================================================== */

    const props: ComponentProps<Icon> = $props()
</script>

<Icon {...props} />
