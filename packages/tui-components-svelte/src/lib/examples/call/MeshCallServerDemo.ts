import type { Server as HttpServer } from "http"
import type { Http2Server } from "http2"
import { Server } from "socket.io"
import { MSG, type RecvSignal, type SendSignal } from "./messages.js"
import type { MediaState } from "../../media/MediaState"
import type { AddPeer, RemovePeer } from "$lib/call/Call.svelte"

/* ============================================================================================== */

export type ClientId = string
export type RoomId = string

type Room = {
    clients: ClientsState
    call: CallState
}
export type ClientsState = Set<ClientId>
export type CallState = Map<ClientId, MediaState>

/* ============================================================================================== */

export function setupSocketIoServer(httpServer: HttpServer | Http2Server) {
    const io = new Server(httpServer, {
        pingTimeout: 2500,
    })

    /* ========================================================================================== */

    function emit_clients(room: Room) {
        room.clients.forEach((clientId) => {
            // NOTE: Have to use spread syntax because JSON.stringify doesn't support Set
            io.to(clientId).emit(MSG.CONNECTED_CLIENTS, [...room.clients])
        })
    }
    function emit_call(room: Room, clientId: ClientId | null = null) {
        if (clientId !== null) {
            io.to(clientId).emit(MSG.CONNECTED_CALL, [...room.call])
        } else {
            room.clients.forEach((clientId) => {
                // NOTE: Have to use spread syntax because JSON.stringify doesn't support Map
                io.to(clientId).emit(MSG.CONNECTED_CALL, [...room.call])
            })
        }
    }

    function remove_client_from_call(room: Room, clientId: ClientId) {
        const wasInCall = room.call.delete(clientId)
        if (!wasInCall) return

        emit_call(room)

        // send REMOVE_PEER to all pairs
        room.call.forEach((_, peerId) => {
            if (peerId === clientId) return

            io.to(clientId).emit(MSG.CALL.REMOVE_PEER, {
                peerId: peerId,
            } satisfies RemovePeer)
            io.to(peerId).emit(MSG.CALL.REMOVE_PEER, {
                peerId: clientId,
            } satisfies RemovePeer)
        })
    }
    function add_client_to_call(room: Room, clientId: ClientId, mediaState: MediaState) {
        if (room.call.has(clientId)) return

        room.call.set(clientId, mediaState)
        emit_call(room)

        // send ADD_PEER to all pairs
        room.call.forEach((_, peerId) => {
            if (peerId === clientId) return

            io.to(clientId).emit(MSG.CALL.ADD_PEER, {
                peerId: peerId,
                offer: true,
            } satisfies AddPeer)
            io.to(peerId).emit(MSG.CALL.ADD_PEER, {
                peerId: clientId,
                offer: false,
            } satisfies AddPeer)
        })

        // signal existing `MediaState`s to new client
        room.call.forEach((mediaState, peerId) => {
            if (peerId === clientId) return

            io.to(clientId).emit(MSG.CALL.SIGNAL.MEDIA_STATE, {
                fromPeerId: peerId,
                content: mediaState,
            } satisfies RecvSignal<MediaState>)
        })
    }

    /* ========================================================================================== */

    const rooms = new Map<RoomId, Room>()

    /* ========================================================================================== */

    io.on("connection", (socket) => {
        console.log(`[WS] (connection) Socket ${socket.id} connection`)

        socket.on("debug", () => {
            console.log(rooms)
        })

        /* ====================================================================================== */

        const clientId = socket.id
        const roomId = socket.handshake.query["roomId"]
        if (typeof roomId !== "string") {
            console.warn(
                `[Room] Client ${clientId} tried to connect but provided an invalid roomId ${roomId}, disconnecting`,
            )
            socket.disconnect()
            return
        }

        /* ================================== Get / Create Room ================================= */

        let _room = rooms.get(roomId) ?? null
        // create the call if it doesn't exist
        if (_room === null) {
            _room = {
                clients: new Set(),
                call: new Map(),
            }
            rooms.set(roomId, _room)
        }
        const room = _room

        /* =================================== Connect Client =================================== */

        console.info(`[Room] Client ${clientId} connected to room ${roomId}`)
        room.clients.add(clientId)
        emit_clients(room)

        // !! Send initial data to client
        emit_call(room, clientId)

        /* ===================================== Disconnect ===================================== */

        socket.on("disconnect", (reason) => {
            console.log("[WS] (disconnect)", clientId, reason)
            if (!room.clients.has(clientId)) {
                console.error(`[Room] Client ${clientId} disconnected, but was not connected to the room`)
                return
            }

            // !! Remove from components
            remove_client_from_call(room, clientId)

            // !! Remove client
            room.clients.delete(clientId)
            emit_clients(room)

            console.info(`[Room] Client ${clientId} disconnected`)
        })

        /* ====================================================================================== */
        /*                                    Join / Leave Call                                   */
        /* ====================================================================================== */

        socket.on(MSG.CALL.JOIN, (mediaState: MediaState) => {
            console.log(`reveiced ${MSG.CALL.JOIN} from ${clientId} with mediaState ${JSON.stringify(mediaState)}`)
            if (room.call.has(clientId)) {
                console.warn(`[Call] Client ${clientId} wanted to join the call, but is already joined`)
            }

            add_client_to_call(room, clientId, mediaState)
        })
        socket.on(MSG.CALL.LEAVE, () => {
            console.log(`reveiced ${MSG.CALL.LEAVE} from ${clientId}`)
            if (!room.call.has(clientId)) {
                console.warn(`[Call] Client ${clientId} wanted to leave the call, but is not joined`)
            }

            remove_client_from_call(room, clientId)
        })

        /* ====================================================================================== */
        /*                                         Signals                                        */
        /* ====================================================================================== */

        socket.on(MSG.CALL.SIGNAL.DESCRIPTION, ({ toPeerId, content }: SendSignal<RTCSessionDescriptionInit>) => {
            if (!room.call.has(clientId)) {
                console.warn(`[Call] Client ${clientId} sent a signal (description), but is not connected to the call`)
                return
            }
            if (!room.call.has(toPeerId)) {
                console.warn(
                    `[Call] Client ${toPeerId} should receive a signal (description), but is not connected to the call`,
                )
                return
            }

            // signaling
            io.to(toPeerId).emit(MSG.CALL.SIGNAL.DESCRIPTION, {
                fromPeerId: clientId,
                content,
            } satisfies RecvSignal<RTCSessionDescriptionInit>)
        })
        socket.on(MSG.CALL.SIGNAL.CANDIDATE, ({ toPeerId, content }: SendSignal<RTCIceCandidate>) => {
            if (!room.call.has(clientId)) {
                console.warn(`[Call] Client ${clientId} sent a signal (candidate), but is not connected to the call`)
                return
            }
            if (!room.call.has(toPeerId)) {
                console.warn(
                    `[Call] Client ${toPeerId} should receive a signal (candidate), but is not connected to the call`,
                )
            }

            // signaling
            io.to(toPeerId).emit(MSG.CALL.SIGNAL.CANDIDATE, {
                fromPeerId: clientId,
                content,
            } satisfies RecvSignal<RTCIceCandidate>)
        })
        socket.on(MSG.CALL.SIGNAL.MEDIA_STATE, (mediaState: MediaState) => {
            if (!room.call.has(clientId)) {
                console.warn(`[Call] Client ${clientId} sent a signal (mediaState), but is not connected to the call`)
                return
            }

            // room
            room.call.set(clientId, mediaState)
            emit_call(room)

            // signaling
            room.call.forEach((_, peerId) => {
                if (peerId === clientId) return

                io.to(peerId).emit(MSG.CALL.SIGNAL.MEDIA_STATE, {
                    fromPeerId: clientId,
                    content: mediaState,
                } satisfies RecvSignal<MediaState>)
            })
        })
    })
}
