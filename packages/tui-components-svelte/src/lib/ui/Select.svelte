<script lang="ts" module>
    export type Option<T> = {
        value: T
        /** The label to show instead of the value. */
        label?: string
        disabled?: boolean
    }
</script>

<script lang="ts" generics="Value">
    import Icon, { type IconType } from "$lib/ui/Icon.svelte"
    import chevron_down from "@timephy/tui-icons-svelte/chevron_down"

    /* ========================================================================================== */

    let {
        value = $bindable(),
        options,
        icon = null,
        disabled = false,
        invalid = false,
        tiny = false,
        onclick = () => {},
        onfocus = () => {},
        onchange = () => {},
        class: CLASS,
        ariaLabel,
    }: {
        value: Value
        options: Readonly<Array<Option<Value>>>
        icon?: IconType | null
        /** A tiny Select style. */
        tiny?: boolean
        /** `onclick` is not fired consistently in Safari */
        onclick?: () => void
        onfocus?: () => void
        onchange?: (value: Value) => void
        disabled?: boolean
        invalid?: boolean
        class?: string
        ariaLabel?: string
    } = $props()
</script>

<!--
    @component
    Wraps a native `<select>` element with a custom style and provides type safety.
-->

<div class="relative {CLASS}">
    {#if icon}
        <Icon
            data={icon}
            class="pointer-events-none absolute top-[50%] h-4 w-4 -translate-y-1/2
            {tiny ? 'left-2' : 'left-4'}
            {disabled ? 'opacity-50' : ''}"
        />
    {/if}

    <select
        class="btn w-full cursor-pointer appearance-none truncate
            {tiny ? 'btn-thin pr-2.5 text-center' : 'btn-tall pr-10'}
            {icon ? (tiny ? 'pl-8' : 'pl-11') : tiny ? 'pl-1' : 'pl-4'}
            {invalid ? 'outline outline-1 outline-red' : ''}
            {options.find((o) => o.value === value)?.disabled ? 'text-step-500' : ''}
        "
        bind:value
        onclick={() => onclick()}
        onfocus={() => onfocus()}
        onchange={(e) => onchange(e.currentTarget.value as Value)}
        {disabled}
        aria-invalid={invalid}
        aria-label={ariaLabel}
    >
        {#each options as option}
            <option
                value={option.value}
                label={option.label}
                disabled={option.disabled}
                selected={option.value === value}
            >
                {option.value}
            </option>
        {/each}
    </select>

    {#if !tiny}
        <Icon
            data={chevron_down}
            class="pointer-events-none absolute right-4 top-[50%] h-3 w-3 -translate-y-1/2
                    {disabled ? 'opacity-50' : ''}"
        />
    {/if}
</div>
