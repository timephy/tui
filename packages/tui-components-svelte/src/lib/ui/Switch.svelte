<script lang="ts">
    let {
        value = $bindable(),
        onChange = null,
        disabled = false,
    }: {
        value: boolean
        onChange?: null | ((value: boolean) => void)
        disabled?: boolean
    } = $props()

    function onclick() {
        if (onChange) {
            onChange(!value)
        } else {
            value = !value
        }
    }
</script>

<button
    class="btn relative h-7 w-12 rounded-full duration-200 {value ? 'btn-green' : 'btn-gray'}"
    {onclick}
    {disabled}
>
    <div
        class="absolute bottom-[1px] left-[1px] h-6 w-6 rounded-full bg-white duration-200
            {value ? `translate-x-5` : ``}"
    ></div>
</button>
