import { browser } from "$app/environment"
import { BehaviorSubject } from "rxjs"
import { AudioPipeline } from "./AudioPipeline.svelte"
import { getCam, getMic, getScreen } from "./getMedia"
import { type DeviceInfo } from "./shared"
import { Field } from "$lib/localStorage/index.svelte"

/* ============================================================================================== */

// TODO: Should we someday `stop()` the old track AFTER getting the new one in `_setMic` and `_setCam`, instead of before?

/* ============================================================================================== */
/*                                          Constant Keys                                         */
/* ============================================================================================== */

// export const DEFAULT_MIC_GAIN = 1
export const DEFAULT_MIC_VOLUME_GATE = -45
// export const DEFAULT_MIC_NOISE_SUPPRESSION = true

const LS_MIC_ID = new Field("tui-rtc.mic_id", null, Field.parse_string, { setNullOnDefault: true })
const LS_CAM_ID = new Field("tui-rtc.cam_id", null, Field.parse_string, { setNullOnDefault: true })
const LS_SCREEN_MAX_HEIGHT_ID = new Field("tui-rtc.screen_maxHeight", null, Field.parse_int, {
    setNullOnDefault: true,
})
const LS_MIC_VOLUME_GATE = new Field<number | null>(
    "tui-rtc.mic_volumeGate",
    DEFAULT_MIC_VOLUME_GATE,
    Field.parse_float,
    { setNullOnDefault: false },
)
const LS_MIC_GAIN = new Field("tui-rtc.mic_gain", 1, Field.parse_float, { setNullOnDefault: true })
const LS_MIC_NOISE_SUPPRESSION = new Field(
    "tui-rtc.mic_noiseSuppression",
    true,
    Field.parse_boolean,
    { setNullOnDefault: true },
)

/* ============================================================================================== */
/*                                              Types                                             */
/* ============================================================================================== */

type DeviceId = string | null
export type Error = "error"

/* ============================================================================================== */
/*                                              Locks                                             */
/* ============================================================================================== */

const LOCK_MIC = (cb: () => Promise<void>) => {
    return navigator.locks.request("tui-rtc.mic", cb)
}
const LOCK_CAM = (cb: () => Promise<void>) => {
    return navigator.locks.request("tui-rtc.cam", cb)
}
const LOCK_SCREEN = (cb: () => Promise<void>) => {
    return navigator.locks.request("tui-rtc.screen", cb)
}

/* ============================================================================================== */

const DEBUG = (...msgs: unknown[]) => {
    console.debug("[Media]", ...msgs)
}
const WARN = (...msgs: unknown[]) => {
    console.warn("[Media]", ...msgs)
}

/* ============================================================================================== */
/*                                           newMedia()                                           */
/* ============================================================================================== */

/**
 * The {@link Media} class manages the media devices (mic, cam, screen) and their tracks.
 * It also manages the {@link AudioPipeline} for the mic and the {@link mute} and {@link deaf} states.
 *
 * It is responsible for loading the devices, setting the devices, and managing the tracks.
 */
export class Media {
    /* ========================================================================================== */
    /*                                    Devices + Permissions                                   */
    /* ========================================================================================== */

    // !! Mic
    /** A list of all available mics, updated by {@link _loadDevices} on "devicechange" and "permission.change" events. */
    #mic_devices: DeviceInfo[] = $state([])
    /** The state of the mic permission, updated on "permission.change" event. */
    #mic_permission_state: PermissionState = $state("prompt")
    /** A reference to the {@link PermissionStatus} object for removing the event listener on {@link destroy()}. */
    #mic_permission: PermissionStatus | null = null

    // !! Cam
    /** A list of all available cams, updated by {@link _loadDevices} on "devicechange" and "permission.change" events. */
    #cam_devices: DeviceInfo[] = $state([])
    /** The state of the cam permission, updated on "permission.change" event. */
    #cam_permission_state: PermissionState = $state("prompt")
    /** A reference to the {@link PermissionStatus} object for removing the event listener on {@link destroy()}. */
    #cam_permission: PermissionStatus | null = null

    /* ========================================================================================== */
    /*                                 DeviceIds + Errors + Tracks                                */
    /* ========================================================================================== */

    // !! Mic
    /** The mic device id, updated by {@link _setMic}. */
    #mic_id: DeviceId = $state(LS_MIC_ID.value)
    /** The error state of the mic, updated by {@link _setMic}. */
    #mic_error: Error | null = $state(null)
    /** The mic audio track, updated by {@link _setMic}. */
    #mic_audio: MediaStreamTrack | null = $state(null)
    /** An Observable of {@link mic_audioOutput}. */
    #mic_audio$ = new BehaviorSubject<MediaStreamTrack | null>(null)

    // !! Cam
    /** The cam device id, updated by {@link _setCam}. */
    #cam_id: DeviceId = $state(LS_CAM_ID.value)
    /** The error state of the cam, updated by {@link _setCam}. */
    #cam_error: Error | null = $state(null)
    /** The cam video track, updated by {@link _setCam}. */
    #cam_video: MediaStreamTrack | null = $state(null)
    /** An Observable of {@link cam_video}. */
    #cam_video$ = new BehaviorSubject<MediaStreamTrack | null>(null)

    // !! Screen
    /** The error state of the screen, updated by {@link _setScreen}. */
    #screen_error: Error | null = $state(null)
    /** The screen video track, updated by {@link _setScreen}. */
    #screen_video: MediaStreamTrack | null = $state(null)
    /** The screen audio track, updated by {@link _setScreen}. */
    #screen_audio: MediaStreamTrack | null = $state(null)
    /** An Observable of the screen tracks. */
    #screen_tracks$ = new BehaviorSubject<[MediaStreamTrack, MediaStreamTrack | null] | null>(null)

    /* ========================================================================================== */
    /*                                         Mute + Deaf                                        */
    /* ========================================================================================== */

    /** If the mic is muted, updated by {@link mute}. */
    #mute = $state(false)
    /** An Observable of {@link mute}. */
    #mute$ = new BehaviorSubject(this.#mute)

    /** If the audio is deafened (when true the mic is {@link mute} as well), updated by {@link deaf}. */
    #deaf = $state(false)
    /** An Observable of {@link deaf}. */
    #deaf$ = new BehaviorSubject(this.#deaf)

    /* ========================================================================================== */

    // !! Settings / Constraints
    /** The max height of the screen video track, updated by {@link screen_maxHeight}. */
    #screen_maxHeight = $state(LS_SCREEN_MAX_HEIGHT_ID.value)

    // !! Audio Pipeline
    readonly _mic_pipeline = new AudioPipeline({
        noiseSuppression: LS_MIC_NOISE_SUPPRESSION.value,
        volumeGate: LS_MIC_VOLUME_GATE.value,
        gain: LS_MIC_GAIN.value,
        debug: true,
    })

    /* ========================================================================================== */

    constructor() {
        DEBUG("new Media()")

        if (browser) {
            // initial load device list
            this._loadDevices()

            // reload device list on "devicechange"
            // NOTE: `devicechange` not detected in Chrome
            navigator.mediaDevices.addEventListener("devicechange", async () => {
                DEBUG("event navigator.mediaDevices devicechange")
                await this._loadDevices()
            })

            // reload device list on "permission.change"
            // NOTE: `permission.change` not detected in Safari
            navigator.permissions
                .query({
                    name: "microphone" as PermissionName,
                })
                .then((status) => {
                    this.#mic_permission = status
                    this.#mic_permission_state = status.state

                    status.onchange = async () => {
                        DEBUG("event navigator.permissions microphone onchange")
                        this.#mic_permission_state = status.state
                        // NOTE: Update device list, fixes for Chrome
                        await this._loadDevices()
                    }
                })
            navigator.permissions
                .query({
                    name: "camera" as PermissionName,
                })
                .then((status) => {
                    this.#cam_permission = status
                    this.#cam_permission_state = status.state

                    status.onchange = async () => {
                        DEBUG("event navigator.permissions camera onchange")
                        this.#cam_permission_state = status.state
                        // NOTE: Update device list, fixes for Chrome
                        await this._loadDevices()
                    }
                })
        }
    }

    /**
     * Stop all media and destroy the mic pipeline.
     *
     * After calling this method, the instance should not be used anymore.
     */
    async destroy() {
        // Remove listeners
        navigator.mediaDevices.removeEventListener("devicechange", this._loadDevices)
        this.#mic_permission && (this.#mic_permission.onchange = null)
        this.#cam_permission && (this.#cam_permission.onchange = null)

        // Stop mic
        this.#mic_audio?.stop()
        this.#mic_audio = null
        this.#mic_audio$.next(null)
        // Stop cam
        this.#cam_video?.stop()
        this.#cam_video = null
        this.#cam_video$.next(null)
        // Stop screen
        this.#screen_video?.stop()
        this.#screen_video = null
        this.#screen_audio?.stop()
        this.#screen_audio = null
        this.#screen_tracks$.next(null)

        // Destroy pipeline
        await this._mic_pipeline.destroy()
    }

    /** Deactivate all media devices. */
    async deactivateAll() {
        await Promise.all([
            this._setMic(this.#mic_id, false),
            this._setCam(this.#cam_id, false),
            this._setScreen(false),
        ])
    }

    /**
     * Load the list of available devices.
     * And change the currently active devices if needed (selected one is now available).
     */
    private async _loadDevices() {
        DEBUG("loadDevices()")
        const _devices = (await navigator.mediaDevices.enumerateDevices()).filter(
            // NOTE: If no permission, Chrome lists devices for all available types (audioinput, videoinput, audiooutput), but with a empty string as `deviceId`
            (device) => device.deviceId !== "",
        )

        // update available device lists
        const deviceInfo = (device: MediaDeviceInfo): DeviceInfo => {
            return {
                deviceId: device.deviceId,
                /* Remove device id in the label (e.g. "Razer Seiren Mini (1532:0531)" -> "Razer Sizen Mini"). */
                label: device.label.replace(/ \([0-9a-f]{4}:[0-9a-f]{4}\)$/, ""),
            }
        }
        this.#mic_devices = _devices
            .filter((device) => device.kind === "audioinput")
            .map(deviceInfo)
        this.#cam_devices = _devices
            .filter((device) => device.kind === "videoinput")
            .map(deviceInfo)

        // re-activate devices to activate the user-selected ones if possible
        // (may not have been available before, e.g. if the preffered mic was disconnected and is not reconnected)
        LOCK_MIC(async () => {
            await this._setMic(LS_MIC_ID.value)
        })
        LOCK_CAM(async () => {
            await this._setCam(LS_CAM_ID.value)
        })
    }

    /* ========================================================================================== */
    /*                           `setMic()` + `setCam()` + `setScreen()`                          */
    /* ========================================================================================== */

    /**
     * Set the mic deviceId and maybe load or unload it.
     * @param setId The deviceId of the mic to use.
     * @param load Whether to load the mic (`true`), unload the mic (`false`), or keep the current state (`null`).
     */
    private async _setMic(setId: DeviceId, load: boolean | null = null) {
        this.#mic_id = this.#fixMicId(setId)
        DEBUG(`_setMic(${this.#mic_id}, ${load})`)

        const track = async () => {
            try {
                const stream = await getMic(this.#mic_id)
                const track = stream.getAudioTracks().at(0)
                if (track === undefined) {
                    throw "No audio track"
                }
                track.onended = () => {
                    LOCK_MIC(async () => {
                        DEBUG("mic_audio.onended()")
                        await this._setMic(this.#mic_id, false)
                    })
                }
                this.#mic_error = null
                // special setup
                this.#setMicTrackEnabled(track, this.#mute, this.#deaf)
                return track
            } catch (error) {
                WARN(`Mic Error: ${error}`)
                this.#mic_error = "error"
                return null
            }
        }

        if (load === null) {
            // id changed, reload track if it was loaded before
            if (
                this.#mic_audio !== null &&
                this.#mic_audio.getSettings().deviceId !== this.#mic_id
            ) {
                this.#mic_audio?.stop()
                this.#mic_audio = await track()
                this.#mic_audio$.next(this.mic_audioOutput)
                await this._mic_pipeline.setTrack(this.#mic_audio)
            }
        } else if (load === true) {
            // should load track, do that if it's not loaded or the id changed
            if (
                this.#mic_audio === null ||
                this.#mic_audio.getSettings().deviceId !== this.#mic_id
            ) {
                this.#mic_audio?.stop()
                this.#mic_audio = await track()
                this.#mic_audio$.next(this.mic_audioOutput)
                await this._mic_pipeline.setTrack(this.#mic_audio)
            }
        } else if (load === false) {
            // should unload track, do that
            this.#mic_error = null
            if (this.#mic_audio !== null) {
                this.#mic_audio.stop()
                this.#mic_audio = null
                this.#mic_audio$.next(null)
                await this._mic_pipeline.setTrack(null)
            }
        }
    }

    /**
     * Set the cam deviceId and maybe load or unload it.
     * @param setId The deviceId of the cam to use.
     * @param load Whether to load the cam (`true`), unload the cam (`false`), or keep the current state (`null`).
     */
    private async _setCam(setId: DeviceId, load: boolean | null = null) {
        this.#cam_id = this.#fixCamId(setId)
        DEBUG(`_setCam(${this.#cam_id}, ${load})`)

        const track = async () => {
            try {
                const stream = await getCam(this.#cam_id)
                const track = stream.getVideoTracks().at(0)
                if (track === undefined) {
                    throw "No video track"
                }
                track.onended = () => {
                    LOCK_CAM(async () => {
                        DEBUG("cam_video.onended()")
                        await this._setCam(this.#cam_id, false)
                    })
                }
                this.#cam_error = null
                // NOTE: Constrain cam to 720p
                await this.#setVideoTrackMaxHeight(track, 720)
                return track
            } catch (error) {
                WARN(`Cam Error: ${error}`)
                this.#cam_error = "error"
                return null
            }
        }

        if (load === null) {
            // id changed, reload track if it was loaded before
            if (
                this.#cam_video !== null &&
                this.#cam_video.getSettings().deviceId !== this.#cam_id
            ) {
                this.#cam_video?.stop()
                this.#cam_video = await track()
                this.#cam_video$.next(this.#cam_video)
            }
        } else if (load === true) {
            // should load track, do that if it's not loaded or the id changed
            if (
                this.#cam_video === null ||
                this.#cam_video.getSettings().deviceId !== this.#cam_id
            ) {
                this.#cam_video?.stop()
                this.#cam_video = await track()
                this.#cam_video$.next(this.#cam_video)
            }
        } else if (load === false) {
            // should unload track, do that
            this.#cam_error = null
            if (this.#cam_video !== null) {
                this.#cam_video.stop()
                this.#cam_video = null
                this.#cam_video$.next(this.#cam_video)
            }
        }
    }

    /**
     * Load or unload the screen.
     * @param load Whether to load the screen (`true`), or unload the screen (`false`).
     */
    private async _setScreen(load: boolean) {
        DEBUG(`_setScreen(${load})`)
        const tracks = async (): Promise<[MediaStreamTrack, MediaStreamTrack | null] | null> => {
            try {
                const stream = await getScreen()
                const videoTrack = stream.getVideoTracks().at(0)
                const audioTrack = stream.getAudioTracks().at(0) ?? null
                if (videoTrack === undefined) {
                    throw "No video track"
                }
                videoTrack.onended = () => {
                    LOCK_SCREEN(async () => {
                        DEBUG("screen_video.onended()")
                        await this._setScreen(false)
                    })
                }
                if (audioTrack) {
                    audioTrack.onended = () => {
                        LOCK_SCREEN(async () => {
                            DEBUG("screen_audio.onended()")
                            await this._setScreen(false)
                        })
                    }
                }
                this.#screen_error = null
                // NOTE: Constrain screen video to `screen_maxHeight`
                await this.#setVideoTrackMaxHeight(videoTrack, this.#screen_maxHeight)
                return [videoTrack, audioTrack]
            } catch (error) {
                WARN(`Screen Error: ${error}`)
                this.#screen_error = "error"
                return null
            }
        }

        if (load) {
            // should load track, do that
            this.#screen_video?.stop()
            this.#screen_audio?.stop()
            const _tracks = await tracks()
            this.#screen_video = _tracks?.[0] ?? null
            this.#screen_audio = _tracks?.[1] ?? null
            this.#screen_tracks$.next(
                this.#screen_video !== null ? [this.#screen_video, this.#screen_audio] : null,
            )
        } else {
            // should unload track, do that
            this.#screen_error = null
            if (this.#screen_video !== null || this.#screen_audio !== null) {
                this.#screen_video?.stop()
                this.#screen_video = null
                this.#screen_audio?.stop()
                this.#screen_audio = null
                this.#screen_tracks$.next(null)
            }
        }
    }

    /* ========================================= Exports ======================================== */

    /** The list of available mics. */
    get mic_devices() {
        return this.#mic_devices
    }
    /** The list of available cams. */
    get cam_devices() {
        return this.#cam_devices
    }

    /** The state of the mic permission. */
    get mic_permission() {
        return this.#mic_permission_state
    }
    /** The state of the cam permission. */
    get cam_permission() {
        return this.#cam_permission_state
    }

    /* ========================================================================================== */
    /*                                            `mic`                                           */
    /* ========================================================================================== */

    /**
     * The device id of the mic.
     *
     * If the mic is active, changing this will reload the mic.
     */
    get mic_id() {
        return this.#mic_id
    }
    set mic_id(_mic_id: DeviceId) {
        LOCK_MIC(async () => {
            DEBUG(`mic_id = ${_mic_id}`)
            await this._setMic(_mic_id)
            LS_MIC_ID.value = this.#mic_id
            DEBUG(`mic_id = ${_mic_id} end`)
        })
    }
    /**
     * If the mic is active.
     *
     * If set to `true` the mic will be loaded, if set to `false` the mic will be unloaded.
     */
    get mic_active() {
        return this.#mic_audio !== null
    }
    set mic_active(load: boolean) {
        LOCK_MIC(async () => {
            DEBUG(`mic_active = ${load}`)
            await this._setMic(this.#mic_id, load)
            DEBUG(`mic_active = ${load} end`)
        })
    }

    // !! Track + Error
    /** The mic source track, straight from the mic, before the {@link AudioPipeline}. */
    get mic_audioSource() {
        return this.#mic_audio
    }
    /** The mic output track, after being modified by the {@link AudioPipeline}. */
    get mic_audioOutput() {
        return this._mic_pipeline.output
    }
    /** An Observable of {@link mic_audioOutput}. */
    get mic_audio$() {
        return this.#mic_audio$.asObservable()
    }
    /** The error state of the mic. */
    get mic_error() {
        return this.#mic_error
    }

    /* ===================================== `mic_pipeline` ===================================== */

    // !! Volume
    get mic_volumeSource() {
        return this._mic_pipeline.volumeSource
    }
    get mic_volumeVoice() {
        return this._mic_pipeline.volumeVoice
    }
    /** The volume of the mic, after being modified by the {@link AudioPipeline}. */
    get mic_volumeOutput() {
        return this._mic_pipeline.volume
    }

    // !! Noise Suppression
    /** Whether noise suppression is enabled. */
    get mic_noiseSuppression() {
        return this._mic_pipeline.noiseSuppression
    }
    set mic_noiseSuppression(_noiseSuppression) {
        this._mic_pipeline.noiseSuppression = _noiseSuppression
        LS_MIC_NOISE_SUPPRESSION.value = _noiseSuppression
    }
    get mic_noiseSuppressionLoaded() {
        return this._mic_pipeline.noiseSuppressionLoaded
    }

    // !! Volume Gate
    /** The volume gate of the mic, audio is only passed of above this threshold. */
    get mic_volumeGate() {
        return this._mic_pipeline.volumeGate
    }
    set mic_volumeGate(_volumeGate) {
        DEBUG(`mic_volumeGate = ${_volumeGate}`)
        this._mic_pipeline.volumeGate = _volumeGate
        LS_MIC_VOLUME_GATE.value = _volumeGate
        DEBUG(`mic_volumeGate = ${_volumeGate} end`)
    }
    /** Whether the volume gate is open. */
    get mic_volumeGateOpen() {
        return this._mic_pipeline.volumeGateOpen
    }

    // !! Gain
    /** The gain of the mic, audio is multiplied by this value. */
    get mic_gain() {
        return this._mic_pipeline.gain
    }
    set mic_gain(_gain) {
        DEBUG(`mic_gain = ${_gain}`)
        this._mic_pipeline.gain = _gain
        LS_MIC_GAIN.value = _gain
        DEBUG(`mic_gain = ${_gain} end`)
    }

    // !! Playback
    /** If the output of the {@link AudioPipeline} should be played back to the user. */
    get mic_playback() {
        return this._mic_pipeline.playback
    }
    set mic_playback(_playback) {
        this._mic_pipeline.playback = _playback
    }

    /* ========================================================================================== */
    /*                                            `cam`                                           */
    /* ========================================================================================== */

    /**
     * The device id of the cam.
     *
     * If the cam is active, changing this will reload the cam.
     */
    get cam_id() {
        return this.#cam_id
    }
    set cam_id(id: DeviceId) {
        LOCK_CAM(async () => {
            DEBUG(`cam_id = ${id}`)
            await this._setCam(id)
            LS_CAM_ID.value = this.#cam_id
            DEBUG(`cam_id = ${id} end`)
        })
    }
    /**
     * If the cam is active.
     *
     * If set to `true` the cam will be loaded, if set to `false` the cam will be unloaded.
     */
    get cam_active() {
        return this.#cam_video !== null
    }
    set cam_active(load: boolean) {
        LOCK_CAM(async () => {
            DEBUG(`cam_active = ${load}`)
            await this._setCam(this.#cam_id, load)
            DEBUG(`cam_active = ${load} end`)
        })
    }

    // !! Track + Error
    /** The cam video track. */
    get cam_video() {
        return this.#cam_video
    }
    /** An Observable of {@link cam_video}. */
    get cam_video$() {
        return this.#cam_video$.asObservable()
    }
    /** The error state of the cam. */
    get cam_error() {
        return this.#cam_error
    }

    /* ========================================================================================== */
    /*                                          `screen`                                          */
    /* ========================================================================================== */

    /**
     * If the screen is active.
     *
     * If set to `true` the screen will be loaded, if set to `false` the screen will be unloaded.
     */
    get screen_active() {
        return this.#screen_video !== null || this.#screen_audio !== null
    }
    set screen_active(load: boolean) {
        // TODO: Move actual `getScreen()` call to the outside of the lock
        // TODO: To fix "InvalidAccessError: getDisplayMedia must be called from a user gesture handler." in Safari
        // navigator.locks.request(LOCK_SCREEN, async () => {
        //     await setScreen(load)
        // })
        // NOTE: This is a fix for Safari (see the TODO above)
        this._setScreen(load)
    }

    // !! Track + Error
    /** The screen video track. */
    get screen_video() {
        return this.#screen_video
    }
    /** The screen audio track. */
    get screen_audio() {
        return this.#screen_audio
    }
    /** An Observable of the screen tracks. */
    get screen_tracks$() {
        return this.#screen_tracks$.asObservable()
    }
    /** The error state of the screen. */
    get screen_error() {
        return this.#screen_error
    }

    // !! Settings
    /**
     * The max height of the screen video track.
     *
     * If set to `null` the screen video will be at the highest resolution possible, otherwise it will be constrained.
     */
    get screen_maxHeight() {
        return this.#screen_maxHeight
    }
    set screen_maxHeight(_screen_maxHeight: number | null) {
        LOCK_SCREEN(async () => {
            DEBUG(`screen_maxHeight = ${_screen_maxHeight}`)
            this.#screen_maxHeight = _screen_maxHeight
            LS_SCREEN_MAX_HEIGHT_ID.value = this.#screen_maxHeight
            if (this.#screen_video) {
                await this.#setVideoTrackMaxHeight(this.#screen_video, this.#screen_maxHeight)
            }
            DEBUG(`screen_maxHeight = ${_screen_maxHeight} end`)
        })
    }

    /**
     * If screen access is available on this device.
     *
     * Basically if `navigator.mediaDevices.getDisplayMedia()` is available
     */
    get screen_available() {
        return !!navigator.mediaDevices?.getDisplayMedia // && false
    }

    /* ========================================================================================== */
    /*                                         Mute + Deaf                                        */
    /* ========================================================================================== */

    // !! Mute
    /**
     * If the mic is muted.
     *
     * If set to `true` the mic will be disabled, if set to `false` the mic will be enabled.
     */
    get mute() {
        return this.#mute
    }
    set mute(_mute: boolean) {
        LOCK_MIC(async () => {
            DEBUG(`mute = ${_mute}`)
            this.#mute = _mute
            this.#mute$.next(this.#mute)

            if (this.#mic_audio) {
                this.#setMicTrackEnabled(this.#mic_audio, this.#mute, this.#deaf)
            }
            DEBUG(`mute = ${_mute} end`)
        })
    }
    /** An Observable of {@link mute}. */
    get mute$() {
        return this.#mute$.asObservable()
    }

    // !! Deaf
    /**
     * If the audio is deafened.
     *
     * {@link deaf$} should be observed by the call and mute the audio of Peers.
     * If set to `true` the mic will be disabled, if set to `false` the mic will be enabled.
     */
    get deaf() {
        return this.#deaf
    }
    set deaf(_deaf: boolean) {
        LOCK_MIC(async () => {
            DEBUG(`deaf = ${_deaf}`)
            this.#deaf = _deaf
            this.#deaf$.next(this.#deaf)

            if (this.#mic_audio) {
                this.#setMicTrackEnabled(this.#mic_audio, this.#mute, this.#deaf)
            }
            DEBUG(`deaf = ${_deaf} end`)
        })
    }
    /** An Observable of {@link deaf}. */
    get deaf$() {
        return this.#deaf$.asObservable()
    }

    /* ========================================================================================== */
    /*                                           Helpers                                          */
    /* ========================================================================================== */

    #fixMicId(micId: DeviceId): DeviceId {
        if (
            micId === null ||
            (micId !== null && !this.#mic_devices.some((device) => device.deviceId === micId))
        ) {
            if (this.#mic_devices.some((device) => device.deviceId === "default")) {
                return "default"
            } else {
                return this.#mic_devices.at(0)?.deviceId ?? null
            }
        }
        return micId
    }
    #fixCamId(camId: DeviceId): DeviceId {
        if (
            camId === null ||
            (camId !== null && !this.#cam_devices.some((device) => device.deviceId === camId))
        ) {
            return this.#cam_devices.at(0)?.deviceId ?? null
        }
        return camId
    }

    /** Enable track when we are neigher `mute`, nor `deaf`. */
    #setMicTrackEnabled(track: MediaStreamTrack, mute: boolean, deaf: boolean) {
        track.enabled = !mute && !deaf
    }

    /** Apply size constraint to the screen video track. */
    async #setVideoTrackMaxHeight(track: MediaStreamTrack, maxHeight: number | null) {
        const constraints = maxHeight
            ? {
                  height: { max: maxHeight },
                  width: { max: (maxHeight * 16) / 9 },
              }
            : {
                  height: { max: 2160 },
                  width: { max: (2160 * 16) / 9 },
              }

        await track.applyConstraints(constraints)
    }
}
