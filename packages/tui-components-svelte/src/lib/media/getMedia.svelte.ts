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
    // NOTE: OLD: `echoCancellation: true` makes the audio sound weird, the volume goes up and down, therefore disable it
    // NOTE: REQUIRED for speaker+mic setups to be viable and not to create a feedback loop
    echoCancellation: true,
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

export const getMediaSuccess = $state({
    mic: null as null | boolean,
    cam: null as null | boolean,
    screen: null as null | boolean,
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
        getMediaSuccess.mic = true
        return stream
    } catch (error) {
        DEBUG(`getMic ${deviceId} ERROR ${error}`)
        getMediaSuccess.mic = false
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
        getMediaSuccess.cam = true
        return stream
    } catch (error) {
        DEBUG(`getCam ${deviceId} ERROR ${error}`)
        getMediaSuccess.cam = false
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
        getMediaSuccess.screen = true
        return stream
    } catch (error) {
        DEBUG(`getScreen ERROR ${error}`)
        getMediaSuccess.screen = false
        throw error
    }
}
