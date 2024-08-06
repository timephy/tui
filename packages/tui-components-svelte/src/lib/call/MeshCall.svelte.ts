import type { Subscription } from "rxjs"
import { SvelteMap } from "svelte/reactivity"
import type { Media } from "../media"
import { Peer } from "./peer/Peer.svelte"
import type { MediaState } from "../media/MediaState"
import { Call, type AddPeer, type PeerId, type RemovePeer } from "./Call.svelte"

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

    public override readonly peers: Map<PeerId, Peer> = new SvelteMap()
    private readonly peerSubscriptions: Map<PeerId, Subscription[]> = new Map()

    protected override async receiveAddPeer({ peerId, offer }: AddPeer) {
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
                signalIceCandidate: (iceCandidate: RTCIceCandidate) =>
                    this.signalIceCandidate(peerId, iceCandidate),
                storageId: peerId,
            },
            peerId,
        )
        this.peers.set(peerId, peer)

        // !! Subscribe Peer to Media
        this.peerSubscriptions.set(peerId, [
            this.media.deaf$.subscribe(async (deaf) => {
                peer.playback = !deaf
            }),
            this.media.mic_audio$.subscribe(async (track) => {
                await peer.setTrackMic(track)
            }),
            this.media.cam_video$.subscribe(async (track) => {
                await peer.setTrackCam(track)
            }),
            this.media.screen_tracks$.subscribe(async (tracks) => {
                const trackVideo = tracks?.[0] ?? null
                const trackAudio = tracks?.[1] ?? null
                await Promise.all([
                    peer.setTrackScreenVideo(trackVideo),
                    peer.setTrackScreenAudio(trackAudio),
                ])
            }),
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

        // !! Unsubscribe Peer from Media
        this.peerSubscriptions.get(peerId)?.forEach((sub) => sub.unsubscribe())
        this.peerSubscriptions.delete(peerId)

        // !! Close and Remove Peer Connection
        peer.closeConnection()
        this.peers.delete(peerId)
    }

    public removeAllPeerConnections() {
        this.DEBUG("removeAllPeerConnections")

        this.peerSubscriptions.forEach((subs) => subs.forEach((sub) => sub.unsubscribe()))
        this.peerSubscriptions.clear()

        this.peers.forEach((peer) => peer.closeConnection())
        this.peers.clear()
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
