import { Subject } from "rxjs"
import { AudioPipeline } from "../../media/AudioPipeline.svelte"
import { PeerConnection, type PeerConnectionOptions } from "./PeerConnection.svelte"
import { DEFAULT_MEDIA_STATE, type MediaState } from "../../media/MediaState"
import { Stats } from "../Stats.svelte"
import type { Signal } from "../ui/debug/DebugSignaling.svelte"
import type { PeerDisplay } from "../Call.svelte"
import { SvelteMap } from "svelte/reactivity"
import Storage from "$lib/storage/index.svelte"

/* ============================================================================================== */

export const LS_PEER_GAINS = Storage.Map<string, number>("tui-rtc.peer_gains", new SvelteMap())

/* ============================================================================================== */

export const peerIceError = ["disconnected", "failed"] as const
export type PeerIceError = (typeof peerIceError)[number]
export const peerConnectionError = ["closed", "disconnected", "failed"] as const
export type PeerConnectionError = (typeof peerConnectionError)[number]

/**
 * This class extends {@link PeerConnection}, helps to manage the audio pipeline and media info.
 *
 * - Implements an {@link AudioPipeline} for the received audio (to display a volume meter, etc.)
 * - Manages the {@link MediaState} of the peer, for help with displaying the received media (whether to show <video> elements, etc.)
 */
export class Peer extends PeerConnection implements PeerDisplay {
    readonly stats: Stats

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
            gain: this.options.storageId
                ? (LS_PEER_GAINS.value.get(this.options.storageId) ?? 1)
                : 1,
            playback: true,
        })

        this.stats = new Stats(this._pc)
    }

    /* ========================================================================================== */

    override closeConnection() {
        super.closeConnection()

        // TODO: Close Stats Interval, but cannot restart... therefore leaving on for now
    }

    /* ========================================================================================== */
    /*                                            Error                                           */
    /* ========================================================================================== */

    private readonly _errorIceConnection$ = new Subject<PeerIceError>()
    private readonly _errorConnection$ = new Subject<PeerConnectionError>()

    private readonly _iceConnectionState$ = new Subject<RTCIceConnectionState>()
    private readonly _connectionState$ = new Subject<RTCPeerConnectionState>()

    protected override oniceconnectionstatechange(iceConnectionState: RTCIceConnectionState) {
        super.oniceconnectionstatechange(iceConnectionState)

        this._iceConnectionState$.next(iceConnectionState)

        iceConnectionState = iceConnectionState as PeerIceError
        if (peerIceError.includes(iceConnectionState)) {
            this._errorIceConnection$.next(iceConnectionState)
        }
    }
    protected override onconnectionstatechange(connectionState: RTCPeerConnectionState) {
        super.onconnectionstatechange(connectionState)

        this._connectionState$.next(connectionState)

        connectionState = connectionState as PeerConnectionError
        if (peerConnectionError.includes(connectionState)) {
            this._errorConnection$.next(connectionState)
        }
    }

    /* ========================================================================================== */

    get errorIceConnection$() {
        return this._errorIceConnection$
    }
    get errorConnection$() {
        return this._errorConnection$
    }

    get iceConnectionState$() {
        return this._iceConnectionState$
    }
    get connectionState$() {
        return this._connectionState$
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
            LS_PEER_GAINS.value = LS_PEER_GAINS.value.set(this.options.storageId, value)
        }
    }
    get volume() {
        return this._audioPipeline.volume
    }

    get storageId() {
        return this.options.storageId
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

    /* ========================================================================================== */
    /*                                     ClientMediaDisplay                                     */
    /* ========================================================================================== */

    get micCamStream() {
        return this._remoteStreamMicCam
    }
    get screenStream() {
        return this._remoteStreamScreen
    }

    /* ========================================================================================== */
    /*                                       Debug Signaling                                      */
    /* ========================================================================================== */

    private readonly _signals: Signal[] = $state([])

    protected override signalIceCandidate(iceCandidate: RTCIceCandidate) {
        super.signalIceCandidate(iceCandidate)

        this._signals.push({
            from: "local",
            content: iceCandidate,
        })
    }
    protected override signalSessionDescription(sessionDescription: RTCSessionDescription) {
        super.signalSessionDescription(sessionDescription)

        this._signals.push({
            from: "local",
            content: sessionDescription,
        })
    }

    override async receiveIceCandidate(iceCandidate: RTCIceCandidateInit) {
        super.receiveIceCandidate(iceCandidate)

        this._signals.push({
            from: "remote",
            content: iceCandidate,
        })
    }
    override async receiveSessionDescription(sessionDescription: RTCSessionDescriptionInit) {
        super.receiveSessionDescription(sessionDescription)

        this._signals.push({
            from: "remote",
            content: sessionDescription,
        })
    }

    /* ========================================================================================== */

    get signals() {
        return this._signals
    }
}
