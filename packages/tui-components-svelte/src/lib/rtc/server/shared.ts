import type { PeerId } from "../peer/Peer.svelte"

export type RecvSignal<C> = {
    fromPeerId: PeerId
    content: C
}
export type SendSignal<C> = {
    toPeerId: PeerId
    content: C
}

export type AddPeer = {
    peerId: PeerId
    offer: boolean
}
export type RemovePeer = {
    peerId: PeerId
}

export const MSG = {
    CONNECTED_CLIENTS: "connected-clients",
    CONNECTED_CALL: "connected-call",

    CALL: {
        JOIN: "joinCall",
        LEAVE: "leaveCall",

        ADD_PEER: "addPeer",
        REMOVE_PEER: "removePeer",

        SIGNAL: {
            DESCRIPTION: "description",
            CANDIDATE: "candidate",
            MEDIA_STATE: "mediaState",
        },
    },
} as const
