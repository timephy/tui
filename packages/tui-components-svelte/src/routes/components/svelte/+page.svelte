<script lang="ts">
    import Select from "$lib/components/Select.svelte"
    import Slider from "$lib/components/Slider.svelte"
    import Switch from "$lib/components/Switch.svelte"
    import SwitchLabel from "$lib/components/SwitchLabel.svelte"
</script>

{#snippet title(name: string)}
    <h1 id={name}>{name}</h1>
{/snippet}

<div class="flex gap-6 p-6">
    <div class="card card-p section w-full max-w-sm">
        {@render title("Select")}
        <Select
            options={[{ value: "Option A" }, { value: "Option B" }, { value: "Option C" }]}
            value="Option A"
        />
        <Select
            options={[{ value: "Option A" }, { value: "Option B" }, { value: "Option C" }]}
            value="Option A"
            disabled
        />

        <hr />

        {@render title("Slider")}
        <Slider min={-5} max={10} step={0.05} value={5} />
        <Slider min={-5} max={10} step={0.05} value={0} leftColor="green" rightColor="orange" />
        <Slider min={-5} max={10} step={0.05} value={-2} disabled />

        <hr />

        {@render title("Switch")}
        <Switch value={true} />
        <Switch value={false} />
        <Switch value={true} disabled />

        <hr />

        {@render title("SwitchLabel")}
        <SwitchLabel label="Test" value={true} />
        <SwitchLabel label="Test" value={false} />
        <SwitchLabel label="Test" value={true} disabled />
    </div>
</div>
