import { combineLatest, map } from "rxjs"
import type { Media } from "../media"

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

export function mediaState$(media: Media) {
    return combineLatest([
        media.mute$,
        media.deaf$,
        media.mic_audioOutput$,
        media.cam_video$,
        media.screen_tracks$,
    ]).pipe(
        map(([mute, deaf, mic_audio, cam_video, screen_tracks]) => {
            const screen_video = screen_tracks?.[0] ?? null
            const screen_audio = screen_tracks?.[1] ?? null
            // update local
            const mediaState: MediaState = {
                mute,
                deaf,
                mic: mic_audio !== null,
                cam: cam_video !== null,
                screen: screen_video !== null,
                screen_audio: screen_audio !== null,
            }
            return mediaState
        }),
    )
}
