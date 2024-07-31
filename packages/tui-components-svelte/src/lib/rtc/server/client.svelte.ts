import { io } from "socket.io-client"
import type { Signal } from "../debug/DebugSignaling.svelte"
import type { Media } from "../media"
import { MeshCall } from "../peer/MeshCall.svelte"
import type { MediaState } from "../peer/shared"
import type { Call, Clients } from "./server"
import { MSG, type AddPeer, type RecvSignal, type RemovePeer, type SendSignal } from "./shared"
import type { PeerId } from "../peer/Peer.svelte"

const ICE_SERVERS = [
    // Public (Google)
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
]
const config = { iceServers: ICE_SERVERS }

export function createClient(server: string, roomId: string, media: Media) {
    const signals: Signal[] = $state([])
    const messages: { sender: string; message: unknown }[] = $state([])

    let id: string | null = $state(null)
    let clients: Clients | null = $state(null)
    let call: Call | null = $state(null)

    // NOTE: Using $derived.by instead of $derived because TypeScript thinks `call = null` here otherwise
    let isCallConnected = $derived.by(() => {
        if (id === null || call === null) return false
        return call.has(id)
    })

    /* ========================================================================================== */
    /*                                            Init                                            */
    /* ========================================================================================== */

    const socket = io(server, {
        reconnectionDelayMax: 2500,
        query: { roomId },
    })

    socket.on("connect", () => {
        console.log("[WS] (connect), id:", socket.id)
        id = socket.id!
    })

    const meshCall = new MeshCall(
        config,
        media,
        (mediaState) => {
            socket.emit(MSG.CALL.SIGNAL.MEDIA_STATE, mediaState)
        },
        "local",
    )

    /* ========================================================================================== */
    /*                                        Receive State                                       */
    /* ========================================================================================== */

    socket.on(MSG.CONNECTED_CLIENTS, (_clients: Clients) => {
        clients = new Set(_clients)
    })
    socket.on(MSG.CONNECTED_CALL, (_call: Call) => {
        call = new Map(_call)
    })

    /* ========================================================================================== */
    /*                                      Add / Remove Peer                                     */
    /* ========================================================================================== */

    socket.on(MSG.CALL.ADD_PEER, ({ peerId, offer }: AddPeer) => {
        const peer = meshCall.addPeer(
            peerId,
            !offer, // inverted - we are polite, when we are not the offerer
            (description) => {
                signals.push({ peerId: "local" as PeerId, content: description })
                socket.emit(MSG.CALL.SIGNAL.DESCRIPTION, {
                    toPeerId: peerId,
                    content: description,
                } satisfies SendSignal<RTCSessionDescriptionInit>)
            },
            (candidate) => {
                signals.push({ peerId: "local" as PeerId, content: candidate })
                socket.emit(MSG.CALL.SIGNAL.CANDIDATE, {
                    toPeerId: peerId,
                    content: candidate,
                } satisfies SendSignal<RTCIceCandidate>)
            },
        )
        if (offer) {
            peer.startConnection()
        }
    })
    socket.on(MSG.CALL.REMOVE_PEER, ({ peerId }: RemovePeer) => {
        meshCall.removePeer(peerId)
    })

    /* ========================================================================================== */
    /*                                      Receive Signaling                                     */
    /* ========================================================================================== */

    socket.on(
        MSG.CALL.SIGNAL.DESCRIPTION,
        ({ fromPeerId, content }: RecvSignal<RTCSessionDescriptionInit>) => {
            signals.push({ peerId: fromPeerId, content })
            meshCall.receiveSessionDescription(fromPeerId, content)
        },
    )
    socket.on(MSG.CALL.SIGNAL.CANDIDATE, ({ fromPeerId, content }: RecvSignal<RTCIceCandidate>) => {
        signals.push({ peerId: fromPeerId, content })
        meshCall.receiveIceCandidate(fromPeerId, content)
    })
    socket.on(MSG.CALL.SIGNAL.MEDIA_STATE, ({ fromPeerId, content }: RecvSignal<MediaState>) => {
        // content = JSON.parse(content)
        meshCall.receiveMediaState(fromPeerId, content)
    })

    /* ========================================================================================== */
    /*                                         Debug Print                                        */
    /* ========================================================================================== */

    socket.onAny((event, ...args) => {
        console.debug("[WS received]", event, ...args)
        messages.push({ sender: "server", message: { event, args } })
    })
    socket.onAnyOutgoing((event, ...args) => {
        console.debug("[WS sending]", event, ...args)
        messages.push({ sender: "local", message: { event, args } })
    })

    /* ========================================================================================== */
    /*                                        Unused Events                                       */
    /* ========================================================================================== */

    socket.on("error", () => {
        console.error("[WS] (error)")
    })
    socket.on("ping", () => {
        console.debug("[WS] (ping)")
    })
    socket.on("reconnect", () => {
        console.warn("[WS] (reconnect)")
    })
    socket.on("reconnect_attempt", () => {
        console.warn("[WS] (reconnect_attempt)")
    })
    socket.on("reconnect_error", () => {
        console.error("[WS] (reconnect_error)")
    })
    socket.on("reconnect_failed", () => {
        console.error("[WS] (reconnect_failed)")
    })

    /* ========================================================================================== */
    /*                                           Exports                                          */
    /* ========================================================================================== */

    return {
        get id() {
            return id
        },
        get clients() {
            return clients
        },
        get call() {
            return call
        },
        get signals() {
            return signals
        },
        get messages() {
            return messages
        },
        get isCallConnected() {
            return isCallConnected
        },
        meshCall,
        socket,
        destroy() {
            socket.disconnect()
            meshCall.destroy()
        },
        joinCall() {
            media.mic_active = true
            socket.emit(MSG.CALL.JOIN, meshCall.mediaState)
        },
        leaveCall() {
            media.deactivateAll()
            socket.emit(MSG.CALL.LEAVE)
        },
        sendDebug() {
            socket.emit("debug")
        },
    }
}
