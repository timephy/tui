export type DeviceInfo = {
    deviceId: string
    label: string
}

export const RESOLUTIONS = [
    { value: null, label: "Native Resolution" },
    { value: 2160, label: "2160p (4K)" },
    { value: 1440, label: "1440p (QHD)" },
    { value: 1080, label: "1080p (Full HD)" },
    { value: 720, label: "720p (HD)" },
    { value: 540, label: "540p" },
    { value: 360, label: "360p" },
] as const
