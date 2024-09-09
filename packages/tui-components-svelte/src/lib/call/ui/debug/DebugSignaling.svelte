<script lang="ts" module>
    export type Signal = {
        from: "local" | "remote"
        content: RTCIceCandidateInit | RTCSessionDescriptionInit
    }
</script>

<script lang="ts">
    let {
        signals,
        title = "DebugSignal",
    }: {
        signals: Signal[]
        title?: string
    } = $props()

    /* ========================================================================================== */

    function short_sdp(sdp: string): string {
        return sdp
            .split("\n")
            .filter((line) => line.startsWith("m="))
            .map((line) => line.slice(0, 35) + "...")
            .join("\n")
    }
</script>

<div class="section h-full max-h-[50rem] overflow-y-auto">
    <h1>{title}</h1>
    <p>
        descriptions: {signals.filter((signal) => "sdp" in signal.content).length}
        <br />
        ice candidates: {signals.filter((signal) => !("sdp" in signal.content)).length}
    </p>
    <div></div>
    {#each signals as signal}
        {#if !("sdp" in signal.content)}
            <!--  -->
        {:else}
            {@const content = signal.content}
            <div class="item item-p flex items-start justify-between gap-2">
                <p class="note whitespace-pre-line">
                    <span class="text-black dark:text-white">
                        {signal.from}: session description {content.type}
                    </span>
                    <br />
                    {content.sdp !== undefined ? short_sdp(content.sdp) : "undefined"}
                </p>
                <button
                    class="btn btn-thin px-2 text-step-500"
                    onclick={() => {
                        console.log(`${signal.from}: ${content.type}\n${content.sdp} `)
                    }}
                >
                    log
                </button>
            </div>
        {/if}
    {/each}
</div>
