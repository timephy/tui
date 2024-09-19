import { Observable, skip, type Subscription } from "rxjs"
import type { SvelteMap } from "svelte/reactivity"
import type { Media } from "../media"
import { DEFAULT_MEDIA_STATE, mediaState$, type MediaState } from "../media/MediaState"
import type { Stats } from "./Stats.svelte"

/* ================================================================================================================== */
// MARK: Peer

export type PeerId = string

export type AddPeer = {
    peerId: PeerId
    offer: boolean
}
export type RemovePeer = {
    peerId: PeerId
}

/* ================================================================================================================== */
// MARK: Display

/**
 * A type that should be used for any user interface for displaying a call user.
 *
 * Represents a call user, either a remote one, or the local user itself.
 */
export type Display = {
    mediaState: MediaState

    micCamStream: MediaStream
    screenStream: MediaStream
}

export type LocalDisplay = Display & {
    readonly type: "local"

    /** Whether we are sending audio. */
    outputIsSending: boolean
}

export type PeerDisplay = Display & {
    readonly type: "peer"

    signalingState: RTCSignalingState
    iceGatheringState: RTCIceGathererState
    iceConnectionState: RTCIceConnectionState
    connectionState: RTCPeerConnectionState

    /** The volume of the microphone. */
    volume: number
    gain: number
    stats: Stats
}

/* ================================================================================================================== */

export type CallEvents = "peer-connected" | "peer-disconnected" | "peer-error"

/* ================================================================================================================== */
// MARK: Call

export abstract class Call {
    private _mediaState: MediaState = $state(DEFAULT_MEDIA_STATE)
    private _mediaStateSubscription: Subscription
    private _mediaStateSubscriptionSignal: Subscription | null = null

    /* ============================================================================================================== */

    // MARK: Constructor
    constructor(readonly media: Media) {
        this._mediaStateSubscription = mediaState$(media).subscribe((mediaState) => {
            this._mediaState = mediaState
        })
    }

    /* ============================================================================================================== */

    // MARK: destroy()
    /**
     * Destroys the call by unsubscribing from media state changes and deactivating all media devices.
     *
     * 1. Unsubscribe from media state changes
     * 2. Deactivate all media devices
     */
    public async destroy() {
        this._mediaStateSubscription.unsubscribe()

        await this.media.deactivateAllAndReset()
    }

    // MARK: join()
    /**
     * Start default media devices (mic) and signals the server that we want to join the call.
     */
    public async join() {
        try {
            this.signalJoin(this._mediaState)

            this._mediaStateSubscriptionSignal?.unsubscribe()
            this._mediaStateSubscriptionSignal = mediaState$(this.media)
                .pipe(skip(1))
                .subscribe((mediaState) => {
                    this.signalMediaState(mediaState)
                })

            this.media.mic_active = true
        } catch (error) {
            console.error("[Call] Could not signal join", error)
        }
    }

    // MARK: leave()
    /**
     * Signals the server that we want to leave the call and deactivates all media devices.
     *
     * 1. Signal "Leave"
     * 2. Deactivate all media devices
     */
    public async leave() {
        try {
            this._mediaStateSubscriptionSignal?.unsubscribe()

            this.signalLeave()
        } catch (error) {
            console.error("[Call] Could not signal leave", error)
        } finally {
            await this.media.deactivateAllAndReset()
        }
    }

    /* ============================================================================================================== */
    // MARK: PeerDisplay

    public abstract readonly peers: SvelteMap<PeerId, PeerDisplay>

    /* ============================================================================================================== */

    /** Should be derived from the known server-state. */
    public abstract get isConnected(): boolean
    public abstract get events$(): Observable<CallEvents>

    /* ============================================================================================================== */
    // MARK: receive

    // Add/Remove Peers
    protected abstract receiveAddPeer(
        { peerId, offer }: AddPeer, //
    ): Promise<void>
    protected abstract receiveRemovePeer(
        { peerId }: RemovePeer, //
    ): Promise<void>

    // Signals
    protected abstract receiveMediaState(
        fromPeerId: PeerId, //
        mediaState: MediaState,
    ): Promise<void>
    protected abstract receiveSessionDescription(
        fromPeerId: PeerId, //
        sessionDescription: RTCSessionDescriptionInit,
    ): Promise<void>
    protected abstract receiveIceCandidate(
        fromPeerId: PeerId, //
        iceCandidate: RTCIceCandidateInit,
    ): Promise<void>

    /* ============================================================================================================== */
    // MARK: signal

    protected abstract signalJoin(mediaState: MediaState): void
    protected abstract signalLeave(): void

    protected abstract signalMediaState(mediaState: MediaState): void

    protected abstract signalSessionDescription(
        toPeerId: PeerId, //
        sessionDescription: RTCSessionDescription,
    ): void
    protected abstract signalIceCandidate(
        toPeerId: PeerId, //
        iceCandidate: RTCIceCandidate,
    ): void

    /* ============================================================================================================== */
    // MARK: MediaState + LocalDisplay

    public get mediaState() {
        return this._mediaState
    }

    public readonly local: LocalDisplay = ((self: Call) => {
        return {
            get type(): "local" {
                return "local"
            },
            get mediaState() {
                return self._mediaState
            },
            get micCamStream() {
                return self.media.cam_video ? new MediaStream([self.media.cam_video]) : new MediaStream()
            },
            get screenStream() {
                return self.media.screen_video ? new MediaStream([self.media.screen_video]) : new MediaStream()
            },
            get outputIsSending() {
                return self.media.mic_outputIsSending
            },
        }
    })(this)
}
