<!--
    @component
    A select element for choosing a camera device.
-->

<script lang="ts">
    import Select from "$lib/ui/Select.svelte"
    import type { Media } from "$lib/media"
    import { getCam, getMediaSuccess } from "$lib/media/getMedia.svelte"
    import camera_video_fill from "@timephy/tui-icons-svelte/camera_video_fill"

    let { media }: { media: Media } = $props()
</script>

<Select
    bind:value={media.cam_id}
    options={[
        { value: null as string | null, label: "Select Camera", disabled: true },
        ...media.cam_devices.map((device) => {
            return { value: device.deviceId, label: device.label }
        }),
    ]}
    icon={camera_video_fill}
    onfocus={async () => {
        // NOTE: Using onfocus instead of onclick, as onclick is not always triggered in Safari
        if (media.cam_devices.length === 0 || getMediaSuccess.cam === false) {
            console.debug("[SelectCam] onfocus: No devices found, requesting permission")
            try {
                let stream = await getCam(null)
                stream.getTracks().forEach((track) => track.stop())
            } catch (e) {
                console.error("[SelectCam] onfocus: Error requesting permission", e)
            }
        }
    }}
/>
