<script lang="ts" module>
    function svg2png(svg: string, resolution: number, color: "white" | "black"): Promise<Blob> {
        return new Promise((resolve) => {
            const canvas = document.createElement("canvas")
            canvas.width = resolution
            canvas.height = resolution
            const ctx = canvas.getContext("2d")!

            // Apply color to SVG by adding fill attribute
            const coloredSvg = svg.replace("<svg", `<svg fill="${color}"`)

            const img = new Image()
            img.onload = () => {
                ctx.drawImage(img, 0, 0, resolution, resolution)
                canvas.toBlob((blob) => {
                    resolve(blob!)
                })
            }
            img.src = "data:image/svg+xml;base64," + btoa(coloredSvg)
        })
    }
</script>

<script lang="ts">
    import Icon from "$lib/ui/Icon.svelte"
    import * as icons from "@timephy/tui-icons-svelte/ICONS"
    import iconsMeta from "@timephy/tui-icons-svelte/META"
    import Fuse from "fuse.js"

    import { getModalController } from "$lib/modals"

    const MODAL_C = getModalController()

    const items = Object.entries(iconsMeta).map(([key, val]) => {
        return {
            key,
            ...val,
        }
    })

    const fuse = new Fuse(items, {
        ignoreLocation: true,
        useExtendedSearch: true,
        shouldSort: false,
        keys: ["key", "name", "categories", "tags"],
        threshold: 0,
    })

    let query = $state("")
    let showKeys = $state(true)

    const resultIconKeys = $derived(fuse.search(query).map((res) => res.item.key))
</script>

<div class="flex flex-col items-center gap-6 p-6">
    <div class="flex gap-2">
        <div class="item btn-p flex items-center gap-3">
            <p>Show Keys</p>
            <input
                type="checkbox"
                class="rounded-xl border border-step-100 bg-step-050 px-2 py-1 outline-blue"
                bind:checked={showKeys}
            />
        </div>
        <input
            type="text"
            placeholder="Search"
            class="rounded-xl border border-step-100 bg-step-050 px-2 py-1 outline-blue"
            bind:value={query}
        />
        <button class="input btn btn-p btn-thin btn-blue" onclick={() => (query = "")}>
            <Icon data={icons.x_lg} />
        </button>
    </div>
    <div class="card card-p inline-grid grid-cols-10 items-center justify-center gap-2">
        {#each Object.entries(icons) as [key, icon] (key)}
            {#if query === "" || key.includes(query) || resultIconKeys.includes(key)}
                <div class="flex flex-col items-center gap-1">
                    {#snippet _modal()}
                        <div class="card card-p flex min-w-64 flex-col gap-2">
                            <button
                                class="btn btn-p btn-tall"
                                onclick={() => {
                                    navigator.clipboard.writeText(key)
                                    MODAL_C.popAll()
                                }}
                            >
                                Copy Key
                            </button>
                            <button
                                class="btn btn-p btn-tall"
                                onclick={() => {
                                    const svg = new XMLSerializer().serializeToString(
                                        document.getElementById(`icon-${key}`)!,
                                    )
                                    navigator.clipboard.writeText(svg)
                                    MODAL_C.popAll()
                                }}
                            >
                                Copy SVG
                            </button>
                            <button
                                class="btn btn-p btn-tall"
                                onclick={() => {
                                    MODAL_C.push(_modal_png)
                                }}
                            >
                                Copy PNG
                            </button>
                            <button
                                class="btn btn-p btn-tall"
                                onclick={() => {
                                    MODAL_C.push(_modal_png_file)
                                }}
                            >
                                Download PNG
                            </button>
                        </div>
                    {/snippet}
                    {#snippet _modal_png()}
                        {@const svg = new XMLSerializer().serializeToString(document.getElementById(`icon-${key}`)!)}
                        <div class="card card-p flex min-w-64 flex-col gap-2">
                            <button
                                class="btn btn-p btn-tall"
                                onclick={async () => {
                                    const png = await svg2png(svg, 512, "white")

                                    const data = new ClipboardItem({ "image/png": png })
                                    navigator.clipboard.write([data])

                                    MODAL_C.popAll()
                                }}
                            >
                                512px White
                            </button>
                            <button
                                class="btn btn-p btn-tall"
                                onclick={async () => {
                                    const png = await svg2png(svg, 512, "black")

                                    const data = new ClipboardItem({ "image/png": png })
                                    navigator.clipboard.write([data])

                                    MODAL_C.popAll()
                                }}
                            >
                                512px Black
                            </button>
                        </div>
                    {/snippet}
                    {#snippet _modal_png_file()}
                        {@const svg = new XMLSerializer().serializeToString(document.getElementById(`icon-${key}`)!)}
                        <div class="card card-p flex min-w-64 flex-col gap-2">
                            <button
                                class="btn btn-p btn-tall"
                                onclick={async () => {
                                    const png = await svg2png(svg, 512, "white")

                                    const url = URL.createObjectURL(png)
                                    const a = document.createElement("a")
                                    a.href = url
                                    a.download = `${key}-white.png`
                                    document.body.appendChild(a)
                                    a.click()
                                    document.body.removeChild(a)
                                    URL.revokeObjectURL(url)

                                    MODAL_C.popAll()
                                }}
                            >
                                512px White
                            </button>
                            <button
                                class="btn btn-p btn-tall"
                                onclick={async () => {
                                    const png = await svg2png(svg, 512, "black")

                                    const url = URL.createObjectURL(png)
                                    const a = document.createElement("a")
                                    a.href = url
                                    a.download = `${key}-black.png`
                                    document.body.appendChild(a)
                                    a.click()
                                    document.body.removeChild(a)
                                    URL.revokeObjectURL(url)

                                    MODAL_C.popAll()
                                }}
                            >
                                512px Black
                            </button>
                        </div>
                    {/snippet}
                    <button
                        class="item p-4 hover:btn hover:h-auto"
                        onclick={() => {
                            MODAL_C.push(_modal)
                        }}
                    >
                        <Icon data={icon} class="size-10" id="icon-{key}" />
                    </button>
                    {#if showKeys}
                        <p class="max-w-[4.5rem] truncate text-[10px] text-step-600">{key}</p>
                    {/if}
                </div>
            {/if}
        {/each}
    </div>
    <a href="https://icons.getbootstrap.com" class="link text-sm">Bootstrap Icons</a>
</div>
