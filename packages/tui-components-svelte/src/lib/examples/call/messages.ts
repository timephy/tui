import type { PeerId } from "../../rtc/call/Call.svelte"

export type RecvSignal<C> = {
    fromPeerId: PeerId
    content: C
}
export type SendSignal<C> = {
    toPeerId: PeerId
    content: C
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
            MEDIA_STATE: "mediaState",
            CANDIDATE: "candidate",
            DESCRIPTION: "description",
        },
    },
} as const
