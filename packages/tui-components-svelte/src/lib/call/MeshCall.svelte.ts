import { distinctUntilChanged, filter, map, Subject, type Subscription } from "rxjs"
import { SvelteMap } from "svelte/reactivity"
import type { Media } from "../media"
import type { MediaState } from "../media/MediaState"
import { Call, type AddPeer, type CallEvents, type PeerId, type RemovePeer } from "./Call.svelte"
import { Peer } from "./peer/Peer.svelte"

/* ============================================================================================== */

export abstract class MeshCall extends Call {
    private DEBUG = (...msgs: unknown[]) => {
        console.debug(`[MeshCall ${this._debug_id}]`, ...msgs)
    }
    private WARN = (...msgs: unknown[]) => {
        console.warn(`[MeshCall ${this._debug_id}]`, ...msgs)
    }
    private ERROR = (...msgs: unknown[]) => {
        console.error(`[MeshCall ${this._debug_id}]`, ...msgs)
    }

    /* ========================================================================================== */

    constructor(
        media: Media,
        private readonly config: RTCConfiguration,
        readonly _debug_id: string,
    ) {
        super(media)
    }

    public override async destroy() {
        this.removeAllPeerConnections()

        await super.destroy()
    }

    public override async leave() {
        this.removeAllPeerConnections()

        await super.leave()
    }

    /* ========================================================================================== */
    /*                                     Mesh Implementation                                    */
    /* ========================================================================================== */

    public override readonly peers: SvelteMap<PeerId, Peer> = new SvelteMap()
    private readonly peerSubscriptions: Map<PeerId, Subscription[]> = new Map()

    private readonly _events$ = new Subject<CallEvents>()

    public override get events$() {
        return this._events$.asObservable()
    }

    protected override async receiveAddPeer({
        peerId,
        offer,
        storageId = null,
    }: AddPeer & { storageId?: string | null }) {
        this.DEBUG("receiveAddPeer", peerId, "offer", offer)

        let peer = this.peers.get(peerId)
        if (peer) {
            this.WARN(`Peer ${peerId} already exists`)
            return
        }

        // !! Init peer
        peer = new Peer(
            this.config,
            {
                polite: !offer,
                signalSessionDescription: (sessionDescription: RTCSessionDescription) =>
                    this.signalSessionDescription(peerId, sessionDescription),
                signalIceCandidate: (iceCandidate: RTCIceCandidate) => this.signalIceCandidate(peerId, iceCandidate),
                storageId,
            },
            peerId,
        )
        this.peers.set(peerId, peer)

        // !! Subscribe Peer to Media
        this.peerSubscriptions.set(peerId, [
            // ! Media -> Peer
            this.media.deaf$.subscribe(async (deaf) => {
                peer.playback = !deaf
            }),
            this.media.mic_audioOutput$.subscribe(async (track) => {
                await peer.setLocalTrackMic(track)
            }),
            this.media.cam_video$.subscribe(async (track) => {
                await peer.setLocalTrackCam(track)
            }),
            this.media.screen_tracks$.subscribe(async (tracks) => {
                const trackVideo = tracks?.[0] ?? null
                const trackAudio = tracks?.[1] ?? null
                await Promise.all([
                    peer.setLocalTrackScreenVideo(trackVideo),
                    peer.setLocalTrackScreenAudio(trackAudio),
                ])
            }),
            // ! Expose peer
            // INFO: This creates the events that the client can use to show / play sounds for
            peer.connectionState$
                .pipe(
                    map((state): CallEvents | null => {
                        if (state === "connected") {
                            return "peer-connected"
                        } else if (state === "closed") {
                            return "peer-disconnected"
                        } else if (state === "failed") {
                            return "peer-error"
                        } else {
                            // state: "connecting" | "disconnected" | "new"
                            // NOTE: "disconnected" happens during renegotiation, this happens often for very quick moment during normal operation, therefore we ignore it
                            return null
                        }
                    }),
                    filter((event) => event !== null),
                    distinctUntilChanged(),
                )
                .subscribe(this._events$),
        ])

        if (offer) {
            peer.startConnection()
        }
    }
    protected override async receiveRemovePeer({ peerId }: RemovePeer) {
        this.DEBUG("receiveRemovePeer", peerId)

        const peer = this.peers.get(peerId)
        if (!peer) {
            this.WARN(`Peer ${peerId} does not exist`)
            return
        }

        // NOTE: The order here is important, so that all events are still emitted

        // !! Close and Remove Peer Connection
        peer.closeConnection()
        this.peers.delete(peerId)

        // !! Unsubscribe Peer from Media
        this.peerSubscriptions.get(peerId)?.forEach((sub) => sub.unsubscribe())
        this.peerSubscriptions.delete(peerId)
    }

    public removeAllPeerConnections() {
        this.DEBUG("removeAllPeerConnections")

        // NOTE: The order here is important, so that all events are still emitted

        this.peers.forEach((peer) => peer.closeConnection())
        this.peers.clear()

        this.peerSubscriptions.forEach((subs) => subs.forEach((sub) => sub.unsubscribe()))
        this.peerSubscriptions.clear()
    }

    /* ========================================================================================== */
    /*                                       Receive Signals                                      */
    /* ========================================================================================== */

    async receiveMediaState(id: PeerId, mediaState: MediaState) {
        this.DEBUG("receiveMediaState", id, { ...mediaState })

        const peer = this.peers.get(id)
        if (!peer) {
            this.WARN(`Peer ${id} does not exist`)
            return
        }

        await peer.receiveMediaState(mediaState)
    }

    async receiveIceCandidate(id: PeerId, candidate: RTCIceCandidateInit) {
        this.DEBUG("receiveIceCandidate", id)

        const peer = this.peers.get(id)
        if (!peer) {
            this.WARN(`Peer ${id} does not exist`)
            return
        }

        await peer.receiveIceCandidate(candidate)
    }

    async receiveSessionDescription(id: PeerId, description: RTCSessionDescriptionInit) {
        this.DEBUG("receiveSessionDescription", id)

        const peer = this.peers.get(id)
        if (!peer) {
            this.WARN(`Peer ${id} does not exist`)
            return
        }

        await peer.receiveSessionDescription(description)
    }
}
