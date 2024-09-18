// ! Default constraints for media devices
const MICROPHONE_CONSTRAINTS = {
    // NOTE: sensible options, also working with `rnnoise`
    channelCount: 2,
    latency: 0,
    sampleRate: 48000,
    sampleSize: 16,

    // NOTE: following options are useful for noise reduction
    autoGainControl: true,
    noiseSuppression: true,
    voiceIsolation: true,
    // NOTE: `echoCancellation: true` makes the audio sound weird, the volume goes up and down, therefore disable it
    // TODO: Someday check how `echoCancellation` behaves on mobile
    echoCancellation: false,
    echoCancellationType: { ideal: "system" },

    // NOTE: following options were copied from an article... not sure if they are useful
    googEchoCancellation: true,
    googAutoGainControl: true,
    googExperimentalAutoGainControl: true,
    googNoiseSuppression: true,
    googExperimentalNoiseSuppression: true,
    googHighpassFilter: true,
    googTypingNoiseDetection: true,
    googBeamforming: false,
    googArrayGeometry: false,
    googAudioMirroring: true,
    googNoiseReduction: true,
    mozNoiseSuppression: true,
    mozAutoGainControl: true,
}

const CAMERA_CONSTRAINTS = {
    // NOTE: if we specify `ideal: 30`, then macOS prefers iPhone Continuity Camera over local camera (we don't want that)
    frameRate: { max: 30 },
}

const SCREEN_VIDEO_CONSTRAINTS = {
    frameRate: { ideal: 60, max: 60 },
}

const SCREEN_AUDIO_CONSTRAINTS = {
    channelCount: 2,
    latency: 0,
    sampleRate: 48000,
    sampleSize: 16,
}

/* ============================================================================================== */

const DEBUG = (...msgs: unknown[]) => {
    console.debug("[getMedia]", ...msgs)
}

/* ============================================================================================== */

export async function getMic(deviceId: string | null): Promise<MediaStream> {
    DEBUG(`getMic ${deviceId}`)
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
            ...MICROPHONE_CONSTRAINTS,
        },
    })
    DEBUG(`getMic ${deviceId} -> ${stream.getTracks()[0]?.getCapabilities().deviceId}`)
    return stream
}

export async function getCam(deviceId: string | null): Promise<MediaStream> {
    DEBUG(`getCam ${deviceId}`)
    const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
            ...CAMERA_CONSTRAINTS,
        },
    })
    DEBUG(`getCam ${deviceId} -> ${stream.getTracks()[0]?.getCapabilities().deviceId}`)
    return stream
}

export async function getScreen(): Promise<MediaStream> {
    DEBUG(`getScreen`)
    const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            ...SCREEN_VIDEO_CONSTRAINTS,
        },
        audio: {
            ...SCREEN_AUDIO_CONSTRAINTS,
        },
    })
    DEBUG(`getScreen -> ${stream.getTracks()[0]?.getCapabilities().deviceId}`)
    return stream
}
