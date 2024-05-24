<script lang="ts">
    import Slider from "$lib/Slider.svelte"

    let sliderValue: number = 1
</script>

<div class="flex gap-6 p-6">
    <div class="card flex w-96 flex-col gap-2 p-6 [&>hr]:my-2">
        <p class="pb-1 pl-1 font-mono text-sm">btn btn-color</p>
        <button class="btn">Button</button>
        <button class="btn btn-blue">Button</button>
        <button class="btn btn-green">Button</button>
        <button class="btn btn-red">Button</button>
        <button class="btn btn-orange">Button</button>
        <button class="btn btn-transparent">Button</button>
        <hr />
        <p class="pb-1 pl-1 font-mono text-sm">btn btn-thin btn-color</p>
        <button class="btn btn-thin">Button</button>
        <button class="btn btn-thin btn-blue">Button</button>
        <button class="btn btn-thin btn-green">Button</button>
        <button class="btn btn-thin btn-red">Button</button>
        <button class="btn btn-thin btn-orange">Button</button>
        <hr />
        <p class="pb-1 pl-1 font-mono text-sm">disabled btn btn-color</p>
        <button disabled class="btn">Button</button>
        <button disabled class="btn btn-blue">Button</button>
        <button disabled class="btn btn-green">Button</button>
        <button disabled class="btn btn-red">Button</button>
        <button disabled class="btn btn-orange">Button</button>
        <hr />
        <p class="pb-1 pl-1 font-mono text-sm">btn btn-thin hover:btn-color</p>
        <button class="btn btn-thin">Button</button>
        <button class="btn btn-thin hover:btn-blue">Button</button>
        <button class="btn btn-thin hover:btn-green">Button</button>
        <button class="btn btn-thin hover:btn-red">Button</button>
        <button class="btn btn-thin hover:btn-orange">Button</button>
    </div>
    <!--  -->
    <div class="card flex w-96 flex-col gap-2 p-6 [&>hr]:my-2">
        <p class="pb-1 pl-1 font-mono text-sm">a: btn</p>
        <a class="btn" href="#_">Testing</a>
        <hr />
        <p class="pb-1 pl-1 font-mono text-sm">a: link</p>
        <div class="flex gap-4">
            <a class="link" href="#_">Testing</a>
            <a class="link underline" href="#_">Testing</a>
        </div>
        <hr />
        <p class="pb-1 pl-1 font-mono text-sm">Slider ({sliderValue})</p>
        <Slider bind:value={sliderValue} min={0} max={2} step={0.05} />
    </div>
</div>
