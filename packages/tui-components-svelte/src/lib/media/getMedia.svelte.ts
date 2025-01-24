import type { Error } from "./Media.svelte"
import type { All } from "./ui/settings/MediaSettingsDevices.svelte"

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

const CAMERA_CONSTRAINTS: MediaTrackConstraints = {
    // NOTE: if we specify `ideal: 30`, then macOS prefers iPhone Continuity Camera over local camera (we don't want that)
    frameRate: { max: 30 },
    aspectRatio: {
        min: 3 / 4,
        ideal: 4 / 3,
        max: 16 / 9,
    },
    height: {
        min: 480,
        ideal: 720,
        max: 720,
    },
}

const SCREEN_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
    frameRate: { ideal: 60, max: 60 },
}

const SCREEN_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
    channelCount: 2,
    // latency: 0,
    sampleRate: 48000,
    sampleSize: 16,
}

/* ============================================================================================== */

const DEBUG = (...msgs: unknown[]) => {
    console.debug("[getMedia]", ...msgs)
}

/* ============================================================================================== */

export const getMediaErrors = $state({
    mic_error: null as Error | null,
    cam_error: null as Error | null,
    screen_error: null as Error | null,
})

export async function getMic(deviceId: string | null): Promise<MediaStream> {
    try {
        DEBUG(`getMic ${deviceId}`)
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
                ...MICROPHONE_CONSTRAINTS,
            },
        })

        DEBUG(`getMic ${deviceId} -> ${stream.getTracks()[0]?.getCapabilities().deviceId}`)
        getMediaErrors.mic_error = null
        return stream
    } catch (error) {
        DEBUG(`getMic ${deviceId} ERROR ${error}`)
        getMediaErrors.mic_error = "error"
        throw error
    }
}

export async function getCam(deviceId: string | null): Promise<MediaStream> {
    try {
        DEBUG(`getCam ${deviceId}`)
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
                ...CAMERA_CONSTRAINTS,
            },
        })

        DEBUG(`getCam ${deviceId} -> ${stream.getTracks()[0]?.getCapabilities().deviceId}`)
        getMediaErrors.cam_error = null
        return stream
    } catch (error) {
        DEBUG(`getCam ${deviceId} ERROR ${error}`)
        getMediaErrors.cam_error = "error"
        throw error
    }
}

export async function getScreen(): Promise<MediaStream> {
    try {
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
        getMediaErrors.screen_error = null
        return stream
    } catch (error) {
        DEBUG(`getScreen ERROR ${error}`)
        getMediaErrors.screen_error = "error"
        throw error
    }
}
