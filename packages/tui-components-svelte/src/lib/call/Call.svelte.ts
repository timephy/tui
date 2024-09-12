import type { Subscription } from "rxjs"
import type { Media } from "../media"
import { DEFAULT_MEDIA_STATE, mediaState$, type MediaState } from "../media/MediaState"
import type { Stats } from "./Stats.svelte"

/* ============================================================================================== */

export type PeerId = string

export type AddPeer = {
    peerId: PeerId
    offer: boolean
}
export type RemovePeer = {
    peerId: PeerId
}

/* ============================================================================================== */

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

    storageId: string | null
}

/* ============================================================================================== */

export abstract class Call {
    private _mediaState: MediaState = $state(DEFAULT_MEDIA_STATE)
    private _mediaStateSubscription: Subscription

    get mediaState() {
        return this._mediaState
    }

    constructor(readonly media: Media) {
        this._mediaStateSubscription = mediaState$(media).subscribe((mediaState) => {
            this._mediaState = mediaState
            // TODO: This try catch block is a temporary fix for the face that the super constructor can not call (not yet) initialized methods on the child
            try {
                this.signalMediaState(mediaState)
            } catch (_error) {
                // console.info(error)
            }
        })
    }

    /* ========================================================================================== */
    /*                                   General Call Functions                                   */
    /* ========================================================================================== */

    /**
     * Destroys the call by unsubscribing from media state changes and deactivating all media devices.
     *
     * 1. Unsubscribe from media state changes
     * 2. Deactivate all media devices
     */
    public async destroy() {
        this._mediaStateSubscription.unsubscribe()

        await this.media.deactivateAll()
    }

    /**
     * Start default media devices (mic) and signals the server that we want to join the call.
     *
     * 1. Activate microphone
     * 2. Signal "Join"
     */
    public async join() {
        this.media.mic_active = true

        this.signalJoin(this._mediaState)
    }
    /**
     * Signals the server that we want to leave the call and deactivates all media devices.
     *
     * 1. Signal "Leave"
     * 2. Deactivate all media devices
     */
    public async leave() {
        this.signalLeave()

        await this.media.deactivateAll()
    }

    /* ========================================================================================== */

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
            get connectionState() {
                return null
            },
        }
    })(this)

    public abstract readonly peers: Map<PeerId, PeerDisplay>

    /** Should be derived from the known server-state. */
    public abstract get isConnected(): boolean

    /* ========================================================================================== */
    /*                                       Receiving Layer                                      */
    /* ========================================================================================== */

    // !! Add/Remove Peers
    protected abstract receiveAddPeer(
        { peerId, offer }: AddPeer, //
    ): Promise<void>
    protected abstract receiveRemovePeer(
        { peerId }: RemovePeer, //
    ): Promise<void>

    // !! Receive Signals
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

    /* ========================================================================================== */
    /*                                       Signaling Layer                                      */
    /* ========================================================================================== */

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
}
