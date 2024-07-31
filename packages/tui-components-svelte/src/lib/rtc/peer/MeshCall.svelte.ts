import { combineLatest, type Subscription } from "rxjs"
import type { Media } from "../media"
import {
    DEFAULT_MEDIA_STATE,
    type MediaState,
    type SignalIceCandidate,
    type SignalMediaState,
    type SignalSessionDescription,
} from "./shared"
import { SvelteMap } from "svelte/reactivity"
import { Peer, type PeerId } from "./Peer.svelte"

/* ============================================================================================== */

export class MeshCall {
    // NOTE: no `$state` required for `SvelteMap`
    readonly peers: Map<PeerId, Peer> = new SvelteMap()
    private readonly peerSubscriptions: Map<PeerId, Subscription[]> = new Map()

    private readonly subscriptions: Subscription[] = []
    private _localMediaState: MediaState = $state(DEFAULT_MEDIA_STATE)

    /* ========================================================================================== */

    private readonly _signalMediaState: SignalMediaState

    /* ========================================================================================== */

    private DEBUG = (...msgs: unknown[]) => {
        console.debug(`[MeshConnection ${this._debug_id}]`, ...msgs)
    }
    private WARN = (...msgs: unknown[]) => {
        console.warn(`[MeshConnection ${this._debug_id}]`, ...msgs)
    }
    private ERROR = (...msgs: unknown[]) => {
        console.error(`[MeshConnection ${this._debug_id}]`, ...msgs)
    }

    /* ========================================================================================== */

    constructor(
        private readonly config: RTCConfiguration,
        readonly media: Media,
        _signalMediaState: SignalMediaState,
        readonly _debug_id: string,
    ) {
        this._signalMediaState = (mediaState: MediaState) => {
            this.DEBUG("signalMediaState", { ...mediaState })
            _signalMediaState(mediaState)
        }

        this.setup()
    }

    private setup() {
        // !! Create MediaState from Media + Signal
        this.subscriptions.push(
            combineLatest([
                this.media.mute$,
                this.media.deaf$,
                this.media.mic_audio$,
                this.media.cam_video$,
                this.media.screen_tracks$,
            ]).subscribe(([mute, deaf, mic_audio, cam_video, screen_tracks]) => {
                const screen_video = screen_tracks?.[0] ?? null
                const screen_audio = screen_tracks?.[1] ?? null
                // update local
                this._localMediaState = {
                    mute,
                    deaf,
                    mic: mic_audio !== null,
                    cam: cam_video !== null,
                    screen: screen_video !== null,
                    screen_audio: screen_audio !== null,
                }

                // signal to peers
                this._signalMediaState(this._localMediaState)
            }),
        )
    }

    destroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe())
        this.removeAllPeers()
    }

    /* ========================================================================================== */
    /*                                     Add + Remove Peers                                     */
    /* ========================================================================================== */

    // TODO: Should all functions be inside a Lock?

    addPeer(
        id: PeerId,
        polite: boolean,
        signalSessionDescription: SignalSessionDescription,
        signalIceCandidate: SignalIceCandidate,
    ) {
        this.DEBUG("addPeer", id, polite)
        let peer = this.peers.get(id)
        if (peer) {
            this.WARN(`Peer ${id} already exists`)
            return peer
        }

        // !! Init peer
        peer = new Peer(
            this.config,
            {
                polite,
                signalSessionDescription,
                signalIceCandidate,
                storageId: id,
            },
            id,
        )
        this.peers.set(id, peer)

        // !! Subscribe Peer to Media
        this.peerSubscriptions.set(id, [
            this.media.deaf$.subscribe(async (deaf) => (peer.playback = !deaf)),
            this.media.mic_audio$.subscribe(async (track) => await peer.setTrackMic(track)),
            this.media.cam_video$.subscribe(async (track) => await peer.setTrackCam(track)),
            this.media.screen_tracks$.subscribe(async (tracks) => {
                const trackVideo = tracks?.[0] ?? null
                const trackAudio = tracks?.[1] ?? null

                await Promise.all([
                    peer.setTrackScreenVideo(trackVideo),
                    peer.setTrackScreenAudio(trackAudio),
                ])
            }),
        ])

        return peer
    }

    removePeer(id: PeerId) {
        this.DEBUG("removePeer", id)
        const peer = this.peers.get(id)
        if (!peer) {
            this.WARN(`Peer ${id} does not exist`)
            return
        }

        this.peerSubscriptions.get(id)?.forEach((sub) => sub.unsubscribe())
        this.peerSubscriptions.delete(id)

        peer.closeConnection()
        this.peers.delete(id)
    }

    removeAllPeers() {
        this.DEBUG("removeAllPeers")

        this.peerSubscriptions.forEach((subs) => subs.forEach((sub) => sub.unsubscribe()))
        this.peerSubscriptions.clear()

        this.peers.forEach((peer) => peer.closeConnection())
        this.peers.clear()
    }

    /* ========================================================================================== */
    /*                                       Receive Signals                                      */
    /* ========================================================================================== */

    async receiveSessionDescription(id: PeerId, description: RTCSessionDescriptionInit) {
        this.DEBUG("receiveSessionDescription", id)
        const peer = this.peers.get(id)
        if (!peer) {
            this.WARN(`Peer ${id} does not exist`)
            return
        }

        await peer.receiveSessionDescription(description)
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

    async receiveMediaState(id: PeerId, mediaState: MediaState) {
        this.DEBUG("receiveMediaState", id, { ...mediaState })
        const peer = this.peers.get(id)
        if (!peer) {
            this.WARN(`Peer ${id} does not exist`)
            return
        }

        await peer.receiveMediaState(mediaState)
    }

    /* ========================================================================================== */
    /*                                           Exports                                          */
    /* ========================================================================================== */

    get mediaState() {
        return this._localMediaState
    }
}
