export type SignalIceCandidate = (candidate: RTCIceCandidate) => void
export type SignalSessionDescription = (description: RTCSessionDescriptionInit) => void

/** Contains information about what media is being transmitted. */
export type MediaState = {
    mute: boolean
    deaf: boolean
    mic: boolean
    cam: boolean
    screen: boolean
    screen_audio: boolean
}

export const DEFAULT_MEDIA_STATE = Object.freeze({
    mute: false,
    deaf: false,
    mic: false,
    cam: false,
    screen: false,
    screen_audio: false,
})

export type SignalMediaState = (mediaState: MediaState) => void
