import { Field } from "$lib/localStorage/index.svelte"
import { AudioPipeline } from "../media/AudioPipeline.svelte"
import { PeerConnection, type PeerConnectionOptions } from "./PeerConnection.svelte"
import { DEFAULT_MEDIA_STATE, type MediaState } from "./shared"

/* ============================================================================================== */

export const LS_PEER_GAINS = new Field<Map<string, number>>(
    "tui-rtc.peer_gains",
    new Map(),
    Field.parse_map as (str: string) => Map<string, number>,
    { serialize: Field.serialize_map },
)

/* ============================================================================================== */

export type PeerId = string & { __brand: "PeerId" }

/**
 * This class extends {@link PeerConnection}, helps to manage the audio pipeline and media info.
 *
 * - Implements an {@link AudioPipeline} for the received audio (to display a volume meter, etc.)
 * - Manages the {@link MediaState} of the peer, for help with displaying the received media (whether to show <video> elements, etc.)
 */
export class Peer extends PeerConnection {
    constructor(
        config: RTCConfiguration,
        readonly options: PeerConnectionOptions & { storageId: string | null },
        _debug_id: string,
    ) {
        super(config, options, _debug_id)

        this._audioPipeline = new AudioPipeline({
            debug: false,
            noiseSuppression: false,
            volumeGate: null,
            gain: this.options.storageId ? LS_PEER_GAINS.value.get(this.options.storageId) ?? 1 : 1,
            playback: true,
        })
    }

    /* ========================================================================================== */
    /*                                        AudioPipeline                                       */
    /* ========================================================================================== */

    private readonly _audioPipeline: AudioPipeline

    // NOTE: Override this function to set the track on the audio pipeline
    protected override async onRemoteTrackMic(track: MediaStreamTrack) {
        console.log("[Peer] receiveTrackMic", track)
        super.onRemoteTrackMic(track)

        // NOTE: Fix for Chrome: WebRTC audio not playing when not connected to a media element
        // https://stackoverflow.com/questions/71861568/webrtc-with-web-audio-api
        // https://issues.chromium.org/issues/40094084#comment5
        const audio = new Audio()
        // await audio.play()
        audio.srcObject = new MediaStream([track])
        // NOTE: This does not seem to be required but might be sensible
        audio.muted = true
        console.log(audio)

        this._audioPipeline.setTrack(track)
    }

    /* ========================================================================================== */

    get playback() {
        return this._audioPipeline.playback
    }
    set playback(value: boolean) {
        this._audioPipeline.playback = value
    }
    get gain() {
        return this._audioPipeline.gain
    }
    set gain(value: number) {
        this._audioPipeline.gain = value

        if (this.options.storageId !== null) {
            console.log(this.options.storageId)
            LS_PEER_GAINS.value = LS_PEER_GAINS.value.set(this.options.storageId, value)
        }
    }
    get volume() {
        return this._audioPipeline.volume
    }

    /* ========================================================================================== */
    /*                                          MediaState                                         */
    /* ========================================================================================== */

    private _mediaState: MediaState = $state(DEFAULT_MEDIA_STATE)

    // NOTE: This is only `async` to match the `receive*()` of `PeerConnection`
    async receiveMediaState(mediaState: MediaState) {
        this.DEBUG("receiveMediaState", mediaState)
        this._mediaState = mediaState
    }

    /* ========================================================================================== */

    get mediaState() {
        return this._mediaState
    }
}
