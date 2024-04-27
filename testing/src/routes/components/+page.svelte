<script>
    import Slider from "$lib/Slider.svelte"
</script>

<div class="flex gap-6 p-6">
    <div class="card p-6 flex flex-col gap-2 w-96 [&>hr]:my-2">
        <p class="text-sm font-mono pl-1 pb-1">btn btn-color</p>
        <button class="btn">Button</button>
        <button class="btn btn-blue">Button</button>
        <button class="btn btn-green">Button</button>
        <button class="btn btn-red">Button</button>
        <button class="btn btn-orange">Button</button>
        <button class="btn btn-transparent">Button</button>
        <hr />
        <p class="text-sm font-mono pl-1 pb-1">btn btn-thin btn-color</p>
        <button class="btn btn-thin">Button</button>
        <button class="btn btn-thin btn-blue">Button</button>
        <button class="btn btn-thin btn-green">Button</button>
        <button class="btn btn-thin btn-red">Button</button>
        <button class="btn btn-thin btn-orange">Button</button>
        <hr />
        <p class="text-sm font-mono pl-1 pb-1">disabled btn btn-color</p>
        <button disabled class="btn">Button</button>
        <button disabled class="btn btn-blue">Button</button>
        <button disabled class="btn btn-green">Button</button>
        <button disabled class="btn btn-red">Button</button>
        <button disabled class="btn btn-orange">Button</button>
        <hr />
        <p class="text-sm font-mono pl-1 pb-1">btn btn-thin hover:btn-color</p>
        <button class="btn btn-thin">Button</button>
        <button class="btn btn-thin hover:btn-blue">Button</button>
        <button class="btn btn-thin hover:btn-green">Button</button>
        <button class="btn btn-thin hover:btn-red">Button</button>
        <button class="btn btn-thin hover:btn-orange">Button</button>
    </div>
    <!--  -->
    <div class="card p-6 flex flex-col gap-2 w-96 [&>hr]:my-2">
        <p class="text-sm font-mono pl-1 pb-1">a: btn btn-thin hover:btn-color</p>
        <a class="btn flex justify-center items-center" href="#_">Testing</a>
        <hr />
        <p class="text-sm font-mono pl-1 pb-1">a: link</p>
        <div class="flex gap-4">
            <a class="link" href="#_">Testing</a>
            <a class="link underline" href="#_">Testing</a>
        </div>
        <hr />
        <p class="text-sm font-mono pl-1 pb-1">Slider</p>
        <Slider value={1} min={0} max={2} step={0.05} />
    </div>
</div>
