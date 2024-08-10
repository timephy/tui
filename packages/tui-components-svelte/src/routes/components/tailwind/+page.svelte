<script lang="ts">
    import Slider from "$lib/ui/Slider.svelte"
    import gear_wide_connected from "@timephy/tui-icons-svelte/gear_wide_connected"
    import { Icon } from "@timephy/tui-icons-svelte"

    let sliderValue: number = 1
</script>

<div class="flex gap-6 p-6">
    <div class="card flex w-96 flex-col gap-2 p-6 [&>hr]:my-2">
        <p class="pb-1 pl-1 font-mono text-sm">btn btn-color</p>
        <button class="btn btn-tall">Button</button>
        <button class="btn btn-tall btn-blue">Button</button>
        <button class="btn btn-tall btn-green">Button</button>
        <button class="btn btn-tall btn-red">Button</button>
        <button class="btn btn-tall btn-orange">Button</button>
        <button class="btn btn-tall btn-transparent">Button</button>
        <hr />
        <p class="pb-1 pl-1 font-mono text-sm">btn btn-thin btn-color</p>
        <button class="btn btn-thin">Button</button>
        <button class="btn btn-thin btn-blue">Button</button>
        <button class="btn btn-thin btn-green">Button</button>
        <button class="btn btn-thin btn-red">Button</button>
        <button class="btn btn-thin btn-orange">Button</button>
        <hr />
        <p class="pb-1 pl-1 font-mono text-sm">disabled btn btn-color</p>
        <button disabled class="btn btn-tall">Button</button>
        <button disabled class="btn btn-tall btn-blue">Button</button>
        <button disabled class="btn btn-tall btn-green">Button</button>
        <button disabled class="btn btn-tall btn-red">Button</button>
        <button disabled class="btn btn-tall btn-orange">Button</button>
        <hr />
        <p class="pb-1 pl-1 font-mono text-sm">btn btn-thin hover:btn-color</p>
        <button class="btn btn-thin">
            <div class="bg-blue">abc</div>
        </button>
        <button class="btn btn-thin hover:btn-blue">Button</button>
        <button class="btn btn-thin hover:btn-green">Button</button>
        <button class="btn btn-thin hover:btn-red">Button</button>
        <button class="btn btn-thin hover:btn-orange">Button</button>
        <button class="btn btn-thin btn-red hover:btn-gray active:btn-gray">Button</button>
    </div>
    <!--  -->
    <div class="card flex w-96 flex-col gap-2 p-6 [&>hr]:my-2">
        <p class="pb-1 pl-1 font-mono text-sm">a: btn</p>
        <a class="btn btn-thin" href="#_">Testing</a>
        <hr />
        <p class="pb-1 pl-1 font-mono text-sm">a: link</p>
        <div class="flex gap-4">
            <a class="link" href="#_">Testing</a>
            <a class="link underline" href="#_">Testing</a>
        </div>
        <hr />
        <p class="pb-1 pl-1 font-mono text-sm">Slider ({sliderValue})</p>
        <Slider bind:value={sliderValue} min={0} max={2} step={0.05} />
        <hr />
        <div class="item item-p">abc</div>
        <div class="item item-p">abc</div>
        <div class="card card-p">abc</div>
        <div class="card card-p">abc</div>
        <Icon data={gear_wide_connected}></Icon>
        <h1 id="_">_</h1>
    </div>
</div>
