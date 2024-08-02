<script lang="ts">
    const colors = {
        step: [
            "base",
            "000",
            "050",
            "100",
            "150",
            "200",
            "250",
            "300",
            "350",
            "400",
            "450",
            "500",
            "550",
            "600",
            "650",
            "700",
            "750",
            "800",
            "850",
            "900",
        ],
        red: ["000", "050", "100", "150", "200", "250"],
        orange: ["000", "050", "100", "150", "200", "250"],
        yellow: ["000", "050", "100", "150", "200", "250"],
        green: ["000", "050", "100", "150", "200", "250"],
        mint: ["000", "050", "100", "150", "200", "250"],
        teal: ["000", "050", "100", "150", "200", "250"],
        cyan: ["000", "050", "100", "150", "200", "250"],
        blue: ["000", "050", "100", "150", "200", "250"],
        indigo: ["000", "050", "100", "150", "200", "250"],
        purple: ["000", "050", "100", "150", "200", "250"],
        pink: ["000", "050", "100", "150", "200", "250"],
        brown: ["000", "050", "100", "150", "200", "250"],
        gray: ["000", "050", "100", "150", "200", "250"],
    }

    const divClasses = Object.fromEntries(
        Object.entries(colors).map(([color, array]) => {
            return [color, array.map((name) => `bg-${color}-${name}`)]
        }),
    )
</script>

<div class="p-4">
    <p class="dark:text-[#fff]">primary, secondary, tertiary</p>
    <div class="flex flex-wrap gap-2">
        {#each ["bg-primary", "bg-secondary", "bg-tertiary"] as cls}
            <div class="size-24 rounded-lg {cls}"></div>
        {/each}
    </div>
</div>

{#each Object.entries(divClasses) as [color, classes]}
    <div class="p-4">
        <p class="dark:text-[#fff]">{color}</p>
        <div class="flex flex-wrap gap-2">
            {#each classes as cls}
                <div class="size-24 rounded-lg {cls}"></div>
            {/each}
        </div>
    </div>
{/each}

<!-- just so the css is included -->
<div class="bg-primary"></div>
<div class="bg-step-base"></div>
<div class="bg-step-000"></div>
<div class="bg-step-050"></div>
<div class="bg-step-100"></div>
<div class="bg-step-150"></div>
<div class="bg-step-200"></div>
<div class="bg-step-250"></div>
<div class="bg-step-300"></div>
<div class="bg-step-350"></div>
<div class="bg-step-400"></div>
<div class="bg-step-450"></div>
<div class="bg-step-500"></div>
<div class="bg-step-550"></div>
<div class="bg-step-600"></div>
<div class="bg-step-650"></div>
<div class="bg-step-700"></div>
<div class="bg-step-750"></div>
<div class="bg-step-800"></div>
<div class="bg-step-850"></div>
<div class="bg-step-900"></div>
<div class="bg-red-000"></div>
<div class="bg-red-050"></div>
<div class="bg-red-100"></div>
<div class="bg-red-150"></div>
<div class="bg-red-200"></div>
<div class="bg-red-250"></div>
<div class="bg-orange-000"></div>
<div class="bg-orange-050"></div>
<div class="bg-orange-100"></div>
<div class="bg-orange-150"></div>
<div class="bg-orange-200"></div>
<div class="bg-orange-250"></div>
<div class="bg-yellow-000"></div>
<div class="bg-yellow-050"></div>
<div class="bg-yellow-100"></div>
<div class="bg-yellow-150"></div>
<div class="bg-yellow-200"></div>
<div class="bg-yellow-250"></div>
<div class="bg-green-000"></div>
<div class="bg-green-050"></div>
<div class="bg-green-100"></div>
<div class="bg-green-150"></div>
<div class="bg-green-200"></div>
<div class="bg-green-250"></div>
<div class="bg-mint-000"></div>
<div class="bg-mint-050"></div>
<div class="bg-mint-100"></div>
<div class="bg-mint-150"></div>
<div class="bg-mint-200"></div>
<div class="bg-mint-250"></div>
<div class="bg-teal-000"></div>
<div class="bg-teal-050"></div>
<div class="bg-teal-100"></div>
<div class="bg-teal-150"></div>
<div class="bg-teal-200"></div>
<div class="bg-teal-250"></div>
<div class="bg-cyan-000"></div>
<div class="bg-cyan-050"></div>
<div class="bg-cyan-100"></div>
<div class="bg-cyan-150"></div>
<div class="bg-cyan-200"></div>
<div class="bg-cyan-250"></div>
<div class="bg-blue-000"></div>
<div class="bg-blue-050"></div>
<div class="bg-blue-100"></div>
<div class="bg-blue-150"></div>
<div class="bg-blue-200"></div>
<div class="bg-blue-250"></div>
<div class="bg-indigo-000"></div>
<div class="bg-indigo-050"></div>
<div class="bg-indigo-100"></div>
<div class="bg-indigo-150"></div>
<div class="bg-indigo-200"></div>
<div class="bg-indigo-250"></div>
<div class="bg-purple-000"></div>
<div class="bg-purple-050"></div>
<div class="bg-purple-100"></div>
<div class="bg-purple-150"></div>
<div class="bg-purple-200"></div>
<div class="bg-purple-250"></div>
<div class="bg-pink-000"></div>
<div class="bg-pink-050"></div>
<div class="bg-pink-100"></div>
<div class="bg-pink-150"></div>
<div class="bg-pink-200"></div>
<div class="bg-pink-250"></div>
<div class="bg-brown-000"></div>
<div class="bg-brown-050"></div>
<div class="bg-brown-100"></div>
<div class="bg-brown-150"></div>
<div class="bg-brown-200"></div>
<div class="bg-brown-250"></div>
<div class="bg-gray-000"></div>
<div class="bg-gray-050"></div>
<div class="bg-gray-100"></div>
<div class="bg-gray-150"></div>
<div class="bg-gray-200"></div>
<div class="bg-gray-250"></div>
