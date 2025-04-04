<!--
    @component
    A select element for choosing a microphone device.
-->

<script lang="ts">
    import Select from "$lib/ui/Select.svelte"
    import type { Media } from "$lib/media"
    import { getMediaSuccess, getMic } from "$lib/media/getMedia.svelte"
    import mic_fill from "@timephy/tui-icons-svelte/mic_fill"

    let { media }: { media: Media } = $props()
</script>

<Select
    bind:value={media.mic_id}
    options={[
        { value: null as string | null, label: "Select Microphone", disabled: true },
        ...media.mic_devices.map((device) => {
            return { value: device.deviceId, label: device.label }
        }),
    ]}
    icon={mic_fill}
    onfocus={async () => {
        if (media.mic_devices.length === 0 || getMediaSuccess.mic === false) {
            // NOTE: Using onfocus instead of onclick, as onclick is not always triggered in Safari
            console.debug("[SelectMic] onfocus: No devices found, requesting permission")
            try {
                let stream = await getMic(null)
                stream.getTracks().forEach((track) => track.stop())
            } catch (e) {
                console.error("[SelectMic] onfocus: Error requesting permission", e)
            }
        }
    }}
/>
