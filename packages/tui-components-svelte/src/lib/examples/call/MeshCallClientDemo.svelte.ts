import { io, Socket } from "socket.io-client"
import { Media, type MediaState } from "../../media"
import type { CallState, ClientsState } from "./MeshCallServerDemo"
import { MSG, type RecvSignal, type SendSignal } from "./messages"
import type { AddPeer, PeerId, RemovePeer } from "../../call/Call.svelte"
import { MeshCall } from "../../call/MeshCall.svelte"

const ICE_SERVERS = [
    // Public (Google)
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
]
const config = { iceServers: ICE_SERVERS }

/* ============================================================================================== */

export class MeshCallClientDemo extends MeshCall {
    private socket: Socket

    private _id: string | null = $state(null)
    private _clientsState: ClientsState | null = $state(null)
    private _callState: CallState | null = $state(null)

    get id() {
        return this._id
    }
    get clientsState() {
        return this._clientsState
    }
    get callState() {
        return this._callState
    }

    constructor(server: string, roomId: string) {
        super(new Media(), config, "MeshCallClientDemo")

        /* ====================================================================================== */

        // !! Start WebSocket Connection
        this.socket = io(server, {
            reconnectionDelayMax: 2500,
            query: { roomId },
        })

        // NOTE: Debug Print
        this.socket.onAny((event, ...args) => {
            console.debug("[WS received]", event, ...args)
        })
        this.socket.onAnyOutgoing((event, ...args) => {
            console.debug("[WS sending]", event, ...args)
        })

        /* ====================================================================================== */

        this.socket.on("connect", () => {
            console.log("[WS] (connect), id:", this.socket.id)
            this._id = this.socket.id!
        })

        // !! Receive Room State
        this.socket.on(MSG.CONNECTED_CLIENTS, (_clients: ClientsState) => {
            this._clientsState = new Set(_clients)
        })
        this.socket.on(MSG.CONNECTED_CALL, (_call: CallState) => {
            this._callState = new Map(_call)
        })

        // !! Call Events
        this.socket.on(MSG.CALL.ADD_PEER, ({ peerId, offer }: AddPeer) => {
            this.receiveAddPeer({ peerId, offer })
        })
        this.socket.on(MSG.CALL.REMOVE_PEER, ({ peerId }: RemovePeer) => {
            this.receiveRemovePeer({ peerId })
        })

        /* ========================================================================================== */
        /*                                      Receive Signaling                                     */
        /* ========================================================================================== */

        this.socket.on(
            MSG.CALL.SIGNAL.DESCRIPTION,
            ({ fromPeerId, content }: RecvSignal<RTCSessionDescriptionInit>) => {
                this.receiveSessionDescription(fromPeerId, content)
            },
        )
        this.socket.on(
            MSG.CALL.SIGNAL.CANDIDATE,
            ({ fromPeerId, content }: RecvSignal<RTCIceCandidateInit>) => {
                this.receiveIceCandidate(fromPeerId, content)
            },
        )
        this.socket.on(
            MSG.CALL.SIGNAL.MEDIA_STATE,
            ({ fromPeerId, content }: RecvSignal<MediaState>) => {
                this.receiveMediaState(fromPeerId, content)
            },
        )

        /* ====================================================================================== */
        /*                                      Other Events                                      */
        /* ====================================================================================== */

        this.socket.on("error", () => {
            console.error("[WS] (error)")
        })
        this.socket.on("ping", () => {
            console.debug("[WS] (ping)")
        })
        this.socket.on("reconnect", () => {
            console.warn("[WS] (reconnect)")
        })
        this.socket.on("reconnect_attempt", () => {
            console.warn("[WS] (reconnect_attempt)")
        })
        this.socket.on("reconnect_error", () => {
            console.error("[WS] (reconnect_error)")
        })
        this.socket.on("reconnect_failed", () => {
            console.error("[WS] (reconnect_failed)")
        })
    }

    public override get isConnected(): boolean {
        // return false
        if (this._id === null || this._callState === null) return false
        return this._callState.has(this._id)
    }

    protected override signalJoin(mediaState: MediaState): void {
        this.socket.emit(MSG.CALL.JOIN, mediaState)
    }
    protected override signalLeave(): void {
        this.socket.emit(MSG.CALL.LEAVE)
    }

    protected override signalMediaState(mediaState: MediaState): void {
        this.socket.emit(MSG.CALL.SIGNAL.MEDIA_STATE, mediaState)
    }
    protected override signalSessionDescription(
        toPeerId: PeerId,
        sessionDescription: RTCSessionDescription,
    ): void {
        this.socket.emit(MSG.CALL.SIGNAL.DESCRIPTION, {
            toPeerId,
            content: sessionDescription,
        } satisfies SendSignal<RTCSessionDescriptionInit>)
    }
    protected override signalIceCandidate(toPeerId: PeerId, iceCandidate: RTCIceCandidate): void {
        this.socket.emit(MSG.CALL.SIGNAL.CANDIDATE, {
            toPeerId,
            content: iceCandidate,
        } satisfies SendSignal<RTCIceCandidateInit>)
    }
}
