import { Subject } from "rxjs"
import { AudioPipeline } from "../../media/AudioPipeline.svelte"
import { PeerConnection, type PeerConnectionOptions } from "./PeerConnection.svelte"
import { DEFAULT_MEDIA_STATE, type MediaState } from "../../media/MediaState"
import { Stats } from "../Stats.svelte"
import type { Signal } from "../ui/debug/DebugSignaling.svelte"
import type { PeerDisplay } from "../Call.svelte"
import { SvelteMap } from "svelte/reactivity"
import Storage from "$lib/storage/index.svelte"

/* ================================================================================================================== */

export const LS_PEER_GAINS = Storage.Map<string, number>("tui-rtc.peer_gains", new SvelteMap())

/* ================================================================================================================== */

export const peerIceError = ["disconnected", "failed"] as const
export type PeerIceError = (typeof peerIceError)[number]
export const peerConnectionError = ["closed", "disconnected", "failed"] as const
export type PeerConnectionError = (typeof peerConnectionError)[number]

/* ================================================================================================================== */
// MARK: Peer
/* ================================================================================================================== */

/**
 * This class extends {@link PeerConnection}, helps to manage the audio pipeline and media info.
 *
 * - Implements an {@link AudioPipeline} for the received audio (to display a volume meter, etc.)
 * - Manages the {@link MediaState} of the peer, for help with displaying the received media (whether to show <video> elements, etc.)
 */
export class Peer extends PeerConnection implements PeerDisplay {
    readonly type = "peer"

    /** Monitors the RTCPeerConnection and create statistics to show the user. */
    readonly stats: Stats

    /* ============================================================================================================== */

    constructor(
        config: RTCConfiguration,
        readonly options: PeerConnectionOptions & { storageId: string | null },
        _debug_id: string,
    ) {
        super(config, options, _debug_id)

        this.#audioPipeline = new AudioPipeline({
            debug: false,
            noiseSuppression: false,
            volumeGate: null,
            gain: this.options.storageId ? (LS_PEER_GAINS.value.get(this.options.storageId) ?? 1) : 1,
            playback: true,
        })

        this.stats = new Stats(this._pc)
        this.stats.start()
    }

    override closeConnection() {
        super.closeConnection()

        this.stats.stop()
    }

    /* ============================================================================================================== */
    // MARK: AudioPipeline
    // INFO: Put the received mic audio through an AudioPipeline to manage and detect volume, etc.
    /* ============================================================================================================== */

    readonly #audioPipeline: AudioPipeline

    // NOTE: Override this function to set the track on the audio pipeline
    protected override async onRemoteTrackMic(track: MediaStreamTrack) {
        console.log("[Peer] onRemoteTrackMic", track)
        super.onRemoteTrackMic(track)

        // NOTE: Fix for Chrome: WebRTC audio not playing when not connected to a media element
        // https://stackoverflow.com/questions/71861568/webrtc-with-web-audio-api
        // https://issues.chromium.org/issues/40094084#comment5
        const audio = new Audio()
        // await audio.play()
        audio.srcObject = new MediaStream([track])
        // NOTE: This does not seem to be required but might be sensible
        audio.muted = true

        this.#audioPipeline.setInput(track)
    }

    /* ============================================================================================================== */
    // MARK: MediaState
    /* ============================================================================================================== */

    private _mediaState: MediaState = $state(DEFAULT_MEDIA_STATE)

    // NOTE: This is only `async` to match the `receive*()` of `PeerConnection`
    public async receiveMediaState(mediaState: MediaState) {
        this.DEBUG("receiveMediaState", mediaState)
        this._mediaState = mediaState
    }

    /* ============================================================================================================== */
    // MARK: PeerDisplay
    /* ============================================================================================================== */

    public get mediaState() {
        return this._mediaState
    }

    public get playback() {
        return this.#audioPipeline.playback
    }
    public set playback(value: boolean) {
        this.#audioPipeline.playback = value
    }
    public get gain() {
        return this.#audioPipeline.gain
    }
    public set gain(value: number) {
        this.#audioPipeline.gain = value

        if (this.options.storageId !== null) {
            LS_PEER_GAINS.value = LS_PEER_GAINS.value.set(this.options.storageId, value)
        }
    }
    public get volume() {
        return this.#audioPipeline.volume
    }

    /* ============================================================================================================== */
    // MARK: State + Errors
    // INFO: Expose state and error observables of the underlying `PeerConnection`
    /* ============================================================================================================== */

    private readonly _errorIceConnection$ = new Subject<PeerIceError>()
    private readonly _errorConnection$ = new Subject<PeerConnectionError>()

    private readonly _iceConnectionState$ = new Subject<RTCIceConnectionState>()
    private readonly _connectionState$ = new Subject<RTCPeerConnectionState>()

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

    /* ============================================================================================================== */
    // MARK: Debug Signals
    // INFO: Grab all sent and received signals for debugging purposes
    /* ============================================================================================================== */

    readonly #debugSignals: Signal[] = $state([])

    get debugSignals() {
        return this.#debugSignals
    }

    protected override signalIceCandidate(iceCandidate: RTCIceCandidate) {
        super.signalIceCandidate(iceCandidate)

        this.#debugSignals.push({
            from: "local",
            content: iceCandidate,
        })
    }
    protected override signalSessionDescription(sessionDescription: RTCSessionDescription) {
        super.signalSessionDescription(sessionDescription)

        this.#debugSignals.push({
            from: "local",
            content: sessionDescription,
        })
    }

    override async receiveIceCandidate(iceCandidate: RTCIceCandidateInit) {
        super.receiveIceCandidate(iceCandidate)

        this.#debugSignals.push({
            from: "remote",
            content: iceCandidate,
        })
    }
    override async receiveSessionDescription(sessionDescription: RTCSessionDescriptionInit) {
        super.receiveSessionDescription(sessionDescription)

        this.#debugSignals.push({
            from: "remote",
            content: sessionDescription,
        })
    }
}
