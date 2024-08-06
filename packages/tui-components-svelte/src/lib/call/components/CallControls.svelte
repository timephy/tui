<script lang="ts">
    import { Icon } from "@timephy/tui-icons-svelte"
    import gear_wide_connected from "@timephy/tui-icons-svelte/gear_wide_connected"
    import telephone_fill from "@timephy/tui-icons-svelte/telephone_fill"
    import type { Call } from "../Call.svelte"
    import MediaControls from "$lib/media/components/MediaControls.svelte"

    let {
        layout,
        call,
        muteMic,
        // class: CLASS,
        //
        showMediaSettings,
        joinCallText,
    }: {
        /** Normal layout may be stacked vertically as well, row is always a horizontal stack. */
        layout: "normal" | "row"
        call: Call
        muteMic?: boolean
        // class?: string
        //
        showMediaSettings: () => void
        joinCallText: string
    } = $props()

    let { media } = $derived(call)

    let containerClass = $derived(
        layout === "normal"
            ? media.screen_available
                ? "grid-cols-4"
                : "grid-cols-5"
            : media.screen_available
              ? "grid-cols-6"
              : "grid-cols-5",
    )

    let buttonClass = $derived(
        layout === "normal"
            ? media.screen_available
                ? "col-span-2"
                : ""
            : media.screen_available
              ? ""
              : "",
    )
</script>

{#if !call.isConnected}
    <div class="grid grid-cols-1">
        <button
            tabindex={-1}
            onclick={async () => await call.join()}
            class="btn btn-tall btn-green gap-2"
        >
            <Icon data={telephone_fill} class="size-[18px]" />
            <p>{joinCallText}</p>
        </button>
    </div>
{:else}
    <div class="grid gap-2 {containerClass}">
        <MediaControls {media} {muteMic} />

        <button
            tabindex={-1}
            onclick={showMediaSettings}
            class="btn btn-tall gap-2 {buttonClass}"
            disabled
        >
            <Icon data={gear_wide_connected} class="size-[18px]" />
        </button>

        <button
            tabindex={-1}
            onclick={async () => await call.leave()}
            class="btn btn-tall btn-red gap-2 {buttonClass}"
        >
            <Icon data={telephone_fill} class="size-[18px]" />
        </button>
    </div>
{/if}
