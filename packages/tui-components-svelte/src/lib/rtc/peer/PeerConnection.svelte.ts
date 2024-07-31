import type { SignalIceCandidate, SignalSessionDescription } from "./shared"

/* ============================================================================================== */

// NOTE: These values were observed to be the defaults of a `new RTCPeerConnection()` (Chrome)
const DEFAULT_RTCSignalingState = "stable"
const DEFAULT_RTCIceGathererState = "new"
const DEFAULT_RTCIceConnectionState = "new"
const DEFAULT_RTCPeerConnectionState = "new"

/* ============================================================================================== */
/*                                           Codec Order                                          */
/* ============================================================================================== */

/** Sort (inplace) and also returns the given array `codecs` in order of `prefferedOrder`. */
function sortByMimeTypes(codecs: RTCRtpCodecCapability[], preferredOrder: string[]) {
    return codecs.sort((a, b) => {
        const indexA = preferredOrder.indexOf(a.mimeType)
        const indexB = preferredOrder.indexOf(b.mimeType)
        const orderA = indexA >= 0 ? indexA : Number.MAX_VALUE
        const orderB = indexB >= 0 ? indexB : Number.MAX_VALUE
        return orderA - orderB
    })
}

const sortedCodecsAudio = (() => {
    const supportedCodecsAudio = RTCRtpReceiver.getCapabilities("audio")?.codecs ?? null
    const preferredCodecsAudio = ["audio/opus"]
    return supportedCodecsAudio !== null
        ? sortByMimeTypes(supportedCodecsAudio, preferredCodecsAudio)
        : null
})()
const sortedCodecsVideo = (() => {
    const supportedCodecsVideo = RTCRtpReceiver.getCapabilities("video")?.codecs ?? null
    const preferredCodecsVideo = ["video/AV1", "video/H264", "video/VP8", "video/VP9"]
    return supportedCodecsVideo !== null
        ? sortByMimeTypes(supportedCodecsVideo, preferredCodecsVideo)
        : null
})()

console.log("[PeerConnection] sortedCodecsAudio", sortedCodecsAudio)
console.log("[PeerConnection] sortedCodecsVideo", sortedCodecsVideo)

/* ============================================================================================== */
/*                                         PeerConnection                                         */
/* ============================================================================================== */

export type PeerConnectionOptions = {
    polite: boolean
    signalSessionDescription: SignalSessionDescription
    signalIceCandidate: SignalIceCandidate
}

/**
 * This class represents a WebRTC peer connection.
 *
 * It is a wrapper around the `RTCPeerConnection` class, and provides a more convenient interface for signaling and managing the connection.
 * It implements the "perfect negotiation" pattern (https://w3c.github.io/webrtc-pc/#perfect-negotiation-example)
 *
 * ## Usage
 *
 * - Provide functions to the constructor to signal the session description and ice candidate.
 * - Call `receiveSessionDescription` and `receiveIceCandidate` to receive signals from the remote peer.
 * - Start the connection by calling `startConnection()` on the offering side.
 *
 * ## Extending
 *
 * When implementing a child class, override the `onRemote*()` methods to handle incoming tracks (e.g. when using an `AudioPipeline`).
 *
 * ```ts
 * protected override onRemoteTrackMic(track: MediaStreamTrack) {
 *     super.onRemoteTrackMic(track)
 *     audioPipeline.setTrack(track)
 * }
 * ```
 */
export class PeerConnection {
    // !! Outputs from remote peer
    /** Remote stream with audio and video from mic and cam. */
    readonly remoteStreamMicCam = new MediaStream()
    /** Remote stream with audio and video from screen. */
    readonly remoteStreamScreen = new MediaStream()

    /* ========================================================================================== */
    /*                                     Signaling functions                                    */
    /* ========================================================================================== */

    private readonly _signalIceCandidate: SignalIceCandidate
    private readonly _signalSessionDescription: SignalSessionDescription

    /* ========================================================================================== */

    readonly _pc: RTCPeerConnection

    // NOTE: Variables for "perfect negotiation" pattern (https://w3c.github.io/webrtc-pc/#perfect-negotiation-example)
    private __makingOffer = false
    private __ignoreOffer = false
    private __isSettingRemoteAnswerPending = false

    private _signalingState: RTCSignalingState = $state(DEFAULT_RTCSignalingState)
    private _iceGatheringState: RTCIceGathererState = $state(DEFAULT_RTCIceGathererState)
    private _iceConnectionState: RTCIceConnectionState = $state(DEFAULT_RTCIceConnectionState)
    private _connectionState: RTCPeerConnectionState = $state(DEFAULT_RTCPeerConnectionState)

    /* ========================================================================================== */

    private _transceiverMicAudio: RTCRtpTransceiver | null = null
    private _transceiverCamVideo: RTCRtpTransceiver | null = null
    private _transceiverScreenVideo: RTCRtpTransceiver | null = null
    private _transceiverScreenAudio: RTCRtpTransceiver | null = null

    // NOTE: Keep references to the tracks to send, so when transceivers are created later (on impolite side), they can be added
    private _localTrackMic: MediaStreamTrack | null = null
    private _localTrackCam: MediaStreamTrack | null = null
    private _localTrackScreenVideo: MediaStreamTrack | null = null
    private _localTrackScreenAudio: MediaStreamTrack | null = null

    /* ========================================================================================== */

    protected DEBUG = (...msgs: unknown[]) => {
        console.debug(`[PeerConnection ${this._debug_id}]`, ...msgs)
    }
    protected WARN = (...msgs: unknown[]) => {
        console.warn(`[PeerConnection ${this._debug_id}]`, ...msgs)
    }
    protected ERROR = (...msgs: unknown[]) => {
        console.error(`[PeerConnection ${this._debug_id}]`, ...msgs)
    }

    /* ========================================================================================== */

    constructor(
        readonly config: RTCConfiguration,
        readonly options: PeerConnectionOptions,
        readonly _debug_id: string,
    ) {
        // !! Setup signaling
        this._signalSessionDescription = (description: RTCSessionDescriptionInit) => {
            this.DEBUG("signalSessionDescription", description)
            this.options.signalSessionDescription(description)
        }
        this._signalIceCandidate = (candidate: RTCIceCandidate) => {
            this.DEBUG("signalIceCandidate", candidate)
            this.options.signalIceCandidate(candidate)
        }

        // !! Init PeerConnection
        this.DEBUG("new PeerConnection()", this.options.polite, this.config)
        this._pc = new RTCPeerConnection(this.config)

        // !! on negotiation needed
        this._pc.onnegotiationneeded = async () => {
            try {
                this.DEBUG("onnegotiationneeded")
                this.__makingOffer = true
                await this._pc.setLocalDescription()
                await this._pc.createOffer()
                this._signalSessionDescription(this._pc.localDescription!)
            } catch (error) {
                this.ERROR(error)
            } finally {
                this.__makingOffer = false
            }
        }

        // !! on state
        this._pc.onconnectionstatechange = () => {
            this._connectionState = this._pc.connectionState
        }
        this._pc.onsignalingstatechange = () => {
            this._signalingState = this._pc.signalingState
        }
        this._pc.onicegatheringstatechange = () => {
            this._iceGatheringState = this._pc.iceGatheringState
        }
        this._pc.oniceconnectionstatechange = () => {
            this._iceConnectionState = this._pc.iceConnectionState
        }

        // !! on ice candidate
        this._pc.onicecandidate = (event) => {
            if (event.candidate) {
                this._signalIceCandidate(event.candidate)
            }
        }
        this._pc.onicecandidateerror = (event) => {
            this.WARN("onicecandidateerror", event)
        }

        // !! on track / data
        this._pc.ontrack = (event) => {
            const { track, transceiver } = event
            this.DEBUG("ontrack", transceiver.mid, track.kind, track)

            // NOTE: detecting transceivers by order of addition (`startConnection()`) on the "impolite" side
            // NOTE: direction has to be set to enable sending on the receiving ("polite") side
            if (transceiver.mid === "0") {
                this.onRemoteTrackMic(track)

                if (this._transceiverMicAudio === null) {
                    this.DEBUG("ontrack", transceiver.mid, "- initialized on impolite side")
                    this._transceiverMicAudio = transceiver
                    this._transceiverMicAudio.direction = "sendrecv"
                    this._transceiverMicAudio.sender.replaceTrack(this._localTrackMic)
                }
            } else if (transceiver.mid === "1") {
                this.onRemoteTrackCam(track)

                if (this._transceiverCamVideo === null) {
                    this.DEBUG("ontrack", transceiver.mid, "- initialized on impolite side")
                    this._transceiverCamVideo = transceiver
                    this._transceiverCamVideo.direction = "sendrecv"
                    this._transceiverCamVideo.sender.replaceTrack(this._localTrackCam)
                }
            } else if (transceiver.mid === "2") {
                this.onRemoteTrackScreenVideo(track)

                if (this._transceiverScreenVideo === null) {
                    this.DEBUG("ontrack", transceiver.mid, "- initialized on impolite side")
                    this._transceiverScreenVideo = transceiver
                    this._transceiverScreenVideo.direction = "sendrecv"
                    this._transceiverScreenVideo.sender.replaceTrack(this._localTrackScreenVideo)
                }
            } else if (transceiver.mid === "3") {
                this.onRemoteTrackScreenAudio(track)

                if (this._transceiverScreenAudio === null) {
                    this.DEBUG("ontrack", transceiver.mid, "- initialized on impolite side")
                    this._transceiverScreenAudio = transceiver
                    this._transceiverScreenAudio.direction = "sendrecv"
                    this._transceiverScreenAudio.sender.replaceTrack(this._localTrackScreenAudio)
                }
            } else if (transceiver.mid === null) {
                this.ERROR("ontrack transceiver.mid is null")
            } else {
                this.WARN("ontrack unknown transceiver.mid", transceiver.mid)
            }
        }
        this._pc.ondatachannel = () => {
            this.WARN("ondatachannel should never happen")
        }
    }

    /** Receive the mic audio track of the remote peer (from `ontrack`). */
    protected onRemoteTrackMic(track: MediaStreamTrack) {
        this.remoteStreamMicCam.addTrack(track)
    }
    /** Receive the cam video track of the remote peer (from `ontrack`). */
    protected onRemoteTrackCam(track: MediaStreamTrack) {
        this.remoteStreamMicCam.addTrack(track)
    }
    /** Receive the screen video track of the remote peer (from `ontrack`). */
    protected onRemoteTrackScreenVideo(track: MediaStreamTrack) {
        this.remoteStreamScreen.addTrack(track)
    }
    /** Receive the screen audio track of the remote peer (from `ontrack`). */
    protected onRemoteTrackScreenAudio(track: MediaStreamTrack) {
        this.remoteStreamScreen.addTrack(track)
    }

    /* ========================================================================================== */
    /*                                       Receive Signals                                      */
    /* ========================================================================================== */

    /** Receive a session description from the remote peer. */
    async receiveSessionDescription(description: RTCSessionDescriptionInit) {
        this.DEBUG("receiveSessionDescription", description)

        // NOTE: For "perfect negotiation" pattern (https://w3c.github.io/webrtc-pc/#perfect-negotiation-example)
        const readyForOffer =
            !this.__makingOffer &&
            (this._pc.signalingState === "stable" || this.__isSettingRemoteAnswerPending)
        const offerCollision = description.type === "offer" && !readyForOffer

        this.__ignoreOffer = !this.options.polite && offerCollision
        if (this.__ignoreOffer) {
            return
        }

        this.__isSettingRemoteAnswerPending = description.type === "answer"
        try {
            await this._pc.setRemoteDescription(description)

            if (description.type === "offer") {
                await this._pc.setLocalDescription()
                this._signalSessionDescription(this._pc.localDescription!)
            }
        } catch (err) {
            console.error(err)
        } finally {
            this.__isSettingRemoteAnswerPending = false
        }
    }

    /** Receive an ice candidate from the remote peer. */
    async receiveIceCandidate(candidate: RTCIceCandidateInit) {
        this.DEBUG("receiveIceCandidate", candidate)

        // NOTE: For "perfect negotiation" pattern (https://w3c.github.io/webrtc-pc/#perfect-negotiation-example)
        try {
            await this._pc.addIceCandidate(candidate)
        } catch (err) {
            if (!this.__ignoreOffer) {
                console.error(err)
            }
        }
    }

    /* ========================================================================================== */
    /*                                         Set Tracks                                         */
    /* ========================================================================================== */

    /** Set mic audio track to be sent to the remote peer. */
    async setTrackMic(track: MediaStreamTrack | null) {
        try {
            this.DEBUG("setTrackMic", track)
            this._localTrackMic = track
            await this._transceiverMicAudio?.sender.replaceTrack(track)
        } catch (e) {
            this.ERROR("setTrackMic", e)
        }
    }

    /** Set cam video track to be sent to the remote peer. */
    async setTrackCam(track: MediaStreamTrack | null) {
        try {
            this.DEBUG("setTrackCam", track)
            this._localTrackCam = track
            await this._transceiverCamVideo?.sender.replaceTrack(track)
        } catch (e) {
            this.ERROR("setTrackCam", e)
        }
    }

    /** Set screen video track to be sent to the remote peer. */
    async setTrackScreenVideo(track: MediaStreamTrack | null) {
        try {
            this.DEBUG("setTrackScreenVideo", track)
            this._localTrackScreenVideo = track
            await this._transceiverScreenVideo?.sender.replaceTrack(track)
        } catch (e) {
            this.ERROR("setTrackScreenVideo", e)
        }
    }

    /** Set screen audio track to be sent to the remote peer. */
    async setTrackScreenAudio(track: MediaStreamTrack | null) {
        try {
            this.DEBUG("setTrackScreenAudio", track)
            this._localTrackScreenAudio = track
            await this._transceiverScreenAudio?.sender.replaceTrack(track)
        } catch (e) {
            this.ERROR("setTrackScreenAudio", e)
        }
    }

    /* ========================================================================================== */
    /*                                           Exports                                          */
    /* ========================================================================================== */

    get signalingState() {
        return this._signalingState
    }
    get iceGatheringState() {
        return this._iceGatheringState
    }
    get iceConnectionState() {
        return this._iceConnectionState
    }
    get connectionState() {
        return this._connectionState
    }

    /**
     * Close the connection and cleanup resources.
     */
    closeConnection() {
        this._pc.close()

        // TODO: Is this right?
        this._signalingState = DEFAULT_RTCSignalingState
        this._iceGatheringState = DEFAULT_RTCIceGathererState
        this._iceConnectionState = DEFAULT_RTCIceConnectionState
        this._connectionState = DEFAULT_RTCPeerConnectionState
    }

    /**
     * Start the RTC connection by making an initial offer.
     *
     * This should be called on the offering ("impolite") side to start the connection.
     */
    startConnection() {
        // NOTE: Adding transceivers will create an offer by triggering `onnegotiationneeded`

        this._transceiverMicAudio = this._pc.addTransceiver("audio", {
            direction: "sendrecv",
            sendEncodings: [
                {
                    // maxBitrate?: number;
                    networkPriority: "high",
                    priority: "high",
                },
            ],
        })
        if (sortedCodecsAudio !== null) {
            this._transceiverMicAudio.setCodecPreferences(sortedCodecsAudio)
        }
        this._transceiverMicAudio.sender.replaceTrack(this._localTrackMic)

        this._transceiverCamVideo = this._pc.addTransceiver("video", {
            direction: "sendrecv",
            sendEncodings: [
                {
                    maxBitrate: 10_000_000,
                    networkPriority: "very-low",
                    priority: "very-low",
                    maxFramerate: 30,
                },
            ],
        })
        if (sortedCodecsVideo !== null) {
            this._transceiverCamVideo.setCodecPreferences(sortedCodecsVideo)
        }
        this._transceiverCamVideo.sender.replaceTrack(this._localTrackCam)

        this._transceiverScreenVideo = this._pc.addTransceiver("video", {
            direction: "sendrecv",
            sendEncodings: [
                {
                    maxBitrate: 10_000_000,
                    networkPriority: "low",
                    priority: "low",
                    maxFramerate: 60,
                },
            ],
        })
        if (sortedCodecsVideo !== null) {
            this._transceiverScreenVideo.setCodecPreferences(sortedCodecsVideo)
        }
        this._transceiverScreenVideo.sender.replaceTrack(this._localTrackScreenVideo)

        this._transceiverScreenAudio = this._pc.addTransceiver("audio", {
            direction: "sendrecv",
            sendEncodings: [
                {
                    // maxBitrate?: number;
                    networkPriority: "medium",
                    priority: "medium",
                },
            ],
        })
        if (sortedCodecsAudio !== null) {
            this._transceiverScreenAudio.setCodecPreferences(sortedCodecsAudio)
        }
        this._transceiverScreenAudio.sender.replaceTrack(this._localTrackScreenAudio)
    }
}
