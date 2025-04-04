import { browser } from "$app/environment"

/* ================================================================================================================== */
// MARK: Constants
/* ================================================================================================================== */

// NOTE: These values were observed to be the defaults of a `new RTCPeerConnection()` [Chrome]
const DEFAULT_RTCSignalingState = "stable"
const DEFAULT_RTCIceGathererState = "new"
const DEFAULT_RTCIceConnectionState = "new"
const DEFAULT_RTCPeerConnectionState = "new"

// NOTE: These values were observerd to be the mid values of the transceivers created by `addTransceiver()` [Chrome]
export const TRANSCEIVER_MID_MIC_AUDIO = "0"
export const TRANSCEIVER_MID_CAM_VIDEO = "1"
export const TRANSCEIVER_MID_SCREEN_VIDEO = "2"
export const TRANSCEIVER_MID_SCREEN_AUDIO = "3"

/* ================================================================================================================== */
// MARK: Codec Order
/* ================================================================================================================== */

/** Sort (inplace) and also returns the given array `codecs` in order of `prefferedOrder`. */
function sortByMimeTypes(codecs: RTCRtpCodec[], preferredOrder: string[]) {
    return codecs.sort((a, b) => {
        const indexA = preferredOrder.indexOf(a.mimeType)
        const indexB = preferredOrder.indexOf(b.mimeType)
        const orderA = indexA >= 0 ? indexA : Number.MAX_VALUE
        const orderB = indexB >= 0 ? indexB : Number.MAX_VALUE
        return orderA - orderB
    })
}

const sortedCodecsAudio = (() => {
    // NOTE: Cannot access RTCRtpReceiver on the server
    if (!browser) return []

    try {
        const supportedCodecsAudio = RTCRtpReceiver.getCapabilities("audio")?.codecs ?? null
        const preferredCodecsAudio = ["audio/opus"]
        return supportedCodecsAudio !== null ? sortByMimeTypes(supportedCodecsAudio, preferredCodecsAudio) : null
    } catch (e) {
        console.error("[PeerConnection] sortedCodecsAudio", e)
        return null
    }
})()
const sortedCodecsVideo = (() => {
    // NOTE: Cannot access RTCRtpReceiver on the server
    if (!browser) return []

    try {
        const supportedCodecsVideo = RTCRtpReceiver.getCapabilities("video")?.codecs ?? null
        const preferredCodecsVideo = ["video/AV1", "video/H264", "video/VP8", "video/VP9"]
        return supportedCodecsVideo !== null ? sortByMimeTypes(supportedCodecsVideo, preferredCodecsVideo) : null
    } catch (e) {
        console.error("[PeerConnection] sortedCodecsAudio", e)
        return null
    }
})()

console.log("[PeerConnection] sortedCodecsAudio", sortedCodecsAudio)
console.log("[PeerConnection] sortedCodecsVideo", sortedCodecsVideo)

/* ============================================================================================== */
// MARK: SDP Mangle

/**
 * Modifies the description to enable stereo audio and increase bitrate.
 * @param description The description to modify
 */
function mangleSessionDescription(description: RTCSessionDescriptionInit) {
    description.sdp = description.sdp?.replaceAll("useinbandfec=1", "useinbandfec=1;stereo=1;maxaveragebitrate=510000")
}

/* ================================================================================================================== */
// MARK: PeerConnection
/* ================================================================================================================== */

export type PeerConnectionOptions = {
    polite: boolean
    signalIceCandidate: (candidate: RTCIceCandidate) => void
    signalSessionDescription: (description: RTCSessionDescription) => void
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
    /** Remote stream with audio and video from mic and cam. */
    private readonly _remoteStreamMicCam = new MediaStream()
    /** Remote stream with audio and video from screen. */
    private readonly _remoteStreamScreen = new MediaStream()

    public get micCamStream() {
        return this._remoteStreamMicCam
    }
    public get screenStream() {
        return this._remoteStreamScreen
    }

    /* ============================================================================================================== */

    private _signalingState: RTCSignalingState = $state(DEFAULT_RTCSignalingState)
    private _iceGatheringState: RTCIceGathererState = $state(DEFAULT_RTCIceGathererState)
    private _iceConnectionState: RTCIceConnectionState = $state(DEFAULT_RTCIceConnectionState)
    private _connectionState: RTCPeerConnectionState = $state(DEFAULT_RTCPeerConnectionState)

    public get signalingState() {
        return this._signalingState
    }
    public get iceGatheringState() {
        return this._iceGatheringState
    }
    public get iceConnectionState() {
        return this._iceConnectionState
    }
    public get connectionState() {
        return this._connectionState
    }

    /* ============================================================================================================== */

    // MARK: Connection
    readonly _pc: RTCPeerConnection

    // NOTE: Variables for "perfect negotiation" pattern (https://w3c.github.io/webrtc-pc/#perfect-negotiation-example)
    private __makingOffer = false
    private __ignoreOffer = false
    private __isSettingRemoteAnswerPending = false

    /* ============================================================================================================== */

    private _transceiverMicAudio: RTCRtpTransceiver | null = null
    private _transceiverCamVideo: RTCRtpTransceiver | null = null
    private _transceiverScreenVideo: RTCRtpTransceiver | null = null
    private _transceiverScreenAudio: RTCRtpTransceiver | null = null

    // INFO: Keep references to the tracks to send, so when transceivers are created later (on impolite side), they can be added
    private _localTrackMic: MediaStreamTrack | null = null
    private _localTrackCam: MediaStreamTrack | null = null
    private _localTrackScreenVideo: MediaStreamTrack | null = null
    private _localTrackScreenAudio: MediaStreamTrack | null = null

    /* ============================================================================================================== */

    protected DEBUG = (...msgs: unknown[]) => {
        console.debug(`[PeerConnection ${this._debug_id}]`, ...msgs)
    }
    protected INFO = (...msgs: unknown[]) => {
        console.info(`[PeerConnection ${this._debug_id}]`, ...msgs)
    }
    protected WARN = (...msgs: unknown[]) => {
        console.warn(`[PeerConnection ${this._debug_id}]`, ...msgs)
    }
    protected ERROR = (...msgs: unknown[]) => {
        console.error(`[PeerConnection ${this._debug_id}]`, ...msgs)
    }

    /* ============================================================================================================== */
    // MARK: Constructor
    /* ============================================================================================================== */

    constructor(
        readonly config: RTCConfiguration,
        readonly options: PeerConnectionOptions,
        readonly _debug_id: string,
    ) {
        this.DEBUG("new PeerConnection()", this.options.polite, this.config)
        this._pc = new RTCPeerConnection(this.config)

        /* ========================================================================================================== */

        this._pc.onnegotiationneeded = async () => {
            try {
                this.DEBUG("onnegotiationneeded")
                this.__makingOffer = true
                await this._pc.setLocalDescription()
                await this._pc.createOffer()
                this.signalSessionDescription(this._pc.localDescription!)
            } catch (error) {
                this.ERROR(error)
            } finally {
                this.__makingOffer = false
            }
        }

        this._pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.signalIceCandidate(event.candidate)
            }
        }

        this._pc.ontrack = (event) => {
            const { track, transceiver } = event
            this.DEBUG("ontrack", transceiver.mid, track.kind, track)
            // INFO: onRemoteTrack is async
            this.onRemoteTrack(track, transceiver)
        }

        /* ========================================================================================================== */

        this._pc.onconnectionstatechange = () => {
            this.onconnectionstatechange(this._pc.connectionState)
        }
        this._pc.onsignalingstatechange = () => {
            this.onsignalingstatechange(this._pc.signalingState)
        }
        this._pc.onicegatheringstatechange = () => {
            this.onicegatheringstatechange(this._pc.iceGatheringState)
        }
        this._pc.oniceconnectionstatechange = () => {
            this.oniceconnectionstatechange(this._pc.iceConnectionState)
        }
        this._pc.onicecandidateerror = (event) => {
            this.onicecandidateerror(event)
        }

        /* ========================================================================================================== */

        this._pc.ondatachannel = () => {
            this.WARN("ondatachannel should never happen")
        }
    }

    /* ============================================================================================================== */
    // MARK: onstatechange
    /* ============================================================================================================== */

    protected onsignalingstatechange(signalingState: RTCSignalingState) {
        this.DEBUG("onsignalingstatechange", signalingState)
        this._signalingState = signalingState
    }
    protected onicegatheringstatechange(iceGatheringState: RTCIceGathererState) {
        this.DEBUG("onicegatheringstatechange", iceGatheringState)
        this._iceGatheringState = iceGatheringState
    }
    protected oniceconnectionstatechange(iceConnectionState: RTCIceConnectionState) {
        this.DEBUG("oniceconnectionstatechange", iceConnectionState)
        this._iceConnectionState = iceConnectionState

        // NOTE: Reconnect on failed/disconnected
        if (iceConnectionState === "failed" || iceConnectionState === "disconnected") {
            this._pc.restartIce()
        }
    }
    protected onconnectionstatechange(connectionState: RTCPeerConnectionState) {
        this.INFO("onconnectionstatechange", connectionState)
        this._connectionState = connectionState
    }

    protected onicecandidateerror(event: RTCPeerConnectionIceErrorEvent) {
        this.WARN("onicecandidateerror", event)
    }

    /* ============================================================================================================== */
    // MARK: receive
    /* ============================================================================================================== */

    /** Receive an ice candidate from the remote peer. */
    public async receiveIceCandidate(candidate: RTCIceCandidateInit) {
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
    /** Receive a session description from the remote peer. */
    public async receiveSessionDescription(description: RTCSessionDescriptionInit) {
        mangleSessionDescription(description)

        this.DEBUG("receiveSessionDescription", description)

        // NOTE: For "perfect negotiation" pattern (https://w3c.github.io/webrtc-pc/#perfect-negotiation-example)
        const readyForOffer =
            !this.__makingOffer && (this._pc.signalingState === "stable" || this.__isSettingRemoteAnswerPending)
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
                this.signalSessionDescription(this._pc.localDescription!)
            }
        } catch (err) {
            console.error(err)
        } finally {
            this.__isSettingRemoteAnswerPending = false
        }
    }

    /* ============================================================================================================== */
    // MARK: signal
    /* ============================================================================================================== */

    protected signalIceCandidate(candidate: RTCIceCandidate) {
        this.DEBUG("signalIceCandidate", candidate)
        this.options.signalIceCandidate(candidate)
    }
    protected signalSessionDescription(description: RTCSessionDescription) {
        this.DEBUG("signalSessionDescription", description)
        this.options.signalSessionDescription(description)
    }

    /* ============================================================================================================== */
    // MARK: setLocalTrack
    /* ============================================================================================================== */

    /** Set mic audio track to be sent to the remote peer. */
    public async setLocalTrackMic(track: MediaStreamTrack | null) {
        try {
            this.DEBUG("setLocalTrackMic", track)
            this._localTrackMic = track
            await this._transceiverMicAudio?.sender.replaceTrack(track)
        } catch (e) {
            this.ERROR("setLocalTrackMic", e)
        }
    }
    /** Set cam video track to be sent to the remote peer. */
    public async setLocalTrackCam(track: MediaStreamTrack | null) {
        try {
            this.DEBUG("setLocalTrackCam", track)
            this._localTrackCam = track
            await this._transceiverCamVideo?.sender.replaceTrack(track)
        } catch (e) {
            this.ERROR("setLocalTrackCam", e)
        }
    }
    /** Set screen video track to be sent to the remote peer. */
    public async setLocalTrackScreenVideo(track: MediaStreamTrack | null) {
        try {
            this.DEBUG("setLocalTrackScreenVideo", track)
            this._localTrackScreenVideo = track
            await this._transceiverScreenVideo?.sender.replaceTrack(track)
        } catch (e) {
            this.ERROR("setLocalTrackScreenVideo", e)
        }
    }
    /** Set screen audio track to be sent to the remote peer. */
    public async setLocalTrackScreenAudio(track: MediaStreamTrack | null) {
        try {
            this.DEBUG("setLocalTrackScreenAudio", track)
            this._localTrackScreenAudio = track
            await this._transceiverScreenAudio?.sender.replaceTrack(track)
        } catch (e) {
            this.ERROR("setLocalTrackScreenAudio", e)
        }
    }

    /* ============================================================================================================== */
    // MARK: onRemoteTrack
    /* ============================================================================================================== */

    private async onRemoteTrack(track: MediaStreamTrack, transceiver: RTCRtpTransceiver) {
        // NOTE: detecting transceivers by order of addition (`startConnection()`) on the "impolite" side
        // NOTE: direction has to be set to enable sending on the receiving ("polite") side
        if (transceiver.mid === TRANSCEIVER_MID_MIC_AUDIO) {
            this.onRemoteTrackMic(track)

            if (this._transceiverMicAudio === null) {
                this.DEBUG("ontrack", transceiver.mid, "- initialized on impolite side")
                this._transceiverMicAudio = transceiver
                this._transceiverMicAudio.direction = "sendrecv"

                await this._transceiverMicAudio.sender.replaceTrack(this._localTrackMic)
                await this._configure_transceiverMicAudio(transceiver)
            }
        } else if (transceiver.mid === TRANSCEIVER_MID_CAM_VIDEO) {
            this.onRemoteTrackCam(track)

            if (this._transceiverCamVideo === null) {
                this.DEBUG("ontrack", transceiver.mid, "- initialized on impolite side")
                this._transceiverCamVideo = transceiver
                this._transceiverCamVideo.direction = "sendrecv"

                await this._transceiverCamVideo.sender.replaceTrack(this._localTrackCam)
                await this._configure_transceiverCamVideo(transceiver)
            }
        } else if (transceiver.mid === TRANSCEIVER_MID_SCREEN_VIDEO) {
            this.onRemoteTrackScreenVideo(track)

            if (this._transceiverScreenVideo === null) {
                this.DEBUG("ontrack", transceiver.mid, "- initialized on impolite side")

                this._transceiverScreenVideo = transceiver
                this._transceiverScreenVideo.direction = "sendrecv"

                await this._transceiverScreenVideo.sender.replaceTrack(this._localTrackScreenVideo)
                await this._configure_transceiverScreenVideo(transceiver)
            }
        } else if (transceiver.mid === TRANSCEIVER_MID_SCREEN_AUDIO) {
            this.onRemoteTrackScreenAudio(track)

            if (this._transceiverScreenAudio === null) {
                this.DEBUG("ontrack", transceiver.mid, "- initialized on impolite side")

                this._transceiverScreenAudio = transceiver
                this._transceiverScreenAudio.direction = "sendrecv"

                await this._transceiverScreenAudio.sender.replaceTrack(this._localTrackScreenAudio)
                await this._configure_transceiverScreenAudio(transceiver)
            }
        } else if (transceiver.mid === null) {
            this.ERROR("ontrack transceiver.mid is null")
        } else {
            this.ERROR("ontrack unknown transceiver.mid = ", transceiver.mid, typeof transceiver.mid)
        }
    }

    /** Receive the mic audio track of the remote peer (from `ontrack`). */
    protected onRemoteTrackMic(track: MediaStreamTrack) {
        if (this._remoteStreamMicCam.getAudioTracks().length > 0) {
            this.WARN("onRemoteTrackMic - already has audio track")
        }
        this._remoteStreamMicCam.addTrack(track)
    }
    /** Receive the cam video track of the remote peer (from `ontrack`). */
    protected onRemoteTrackCam(track: MediaStreamTrack) {
        if (this._remoteStreamMicCam.getVideoTracks().length > 0) {
            this.WARN("onRemoteTrackCam - already has video track")
        }
        this._remoteStreamMicCam.addTrack(track)
    }
    /** Receive the screen video track of the remote peer (from `ontrack`). */
    protected onRemoteTrackScreenVideo(track: MediaStreamTrack) {
        if (this._remoteStreamScreen.getVideoTracks().length > 0) {
            this.WARN("onRemoteTrackScreenVideo - already has video track")
        }
        this._remoteStreamScreen.addTrack(track)
    }
    /** Receive the screen audio track of the remote peer (from `ontrack`). */
    protected onRemoteTrackScreenAudio(track: MediaStreamTrack) {
        if (this._remoteStreamScreen.getAudioTracks().length > 0) {
            this.WARN("onRemoteTrackScreenAudio - already has audio track")
        }
        this._remoteStreamScreen.addTrack(track)
    }

    /* ============================================================================================================== */
    // MARK: start() + close()
    /* ============================================================================================================== */

    /**
     * Start the RTC connection by making an initial offer.
     *
     * This should be called on the offering ("impolite") side to start the connection.
     */
    async startConnection() {
        // NOTE: Adding transceivers will create an offer by triggering `onnegotiationneeded`

        // NOTE: Adding `await` in front of all functions, will result in an error
        // NOTE: When using `await` the `transceiver.mid`s are `[0,2,3,4]` instead of `[0,1,2,3]`
        // NOTE: This results in an error when setting the codec preferences, because the track type does not match the codcs
        // NOTE: Error: transceiverScreenAudio.setCodecPreferences() error: InvalidModificationError: Failed to execute 'setCodecPreferences' on 'RTCRtpTransceiver': Invalid codec preferences: Missing codec from recv codec capabilities.

        // NOTE: Adding this now will result in `mid === 0`
        this._transceiverMicAudio = this._pc.addTransceiver("audio", {
            direction: "sendrecv",
            sendEncodings: [this._transceiverMicAudioParameters],
        })
        this._configure_transceiverMicAudio(this._transceiverMicAudio)
        this._transceiverMicAudio.sender.replaceTrack(this._localTrackMic)

        // NOTE: Adding this now will result in `mid === 1`
        this._transceiverCamVideo = this._pc.addTransceiver("video", {
            direction: "sendrecv",
            sendEncodings: [this._transceiverCamVideoParameters],
        })
        this._configure_transceiverCamVideo(this._transceiverCamVideo)
        this._transceiverCamVideo.sender.replaceTrack(this._localTrackCam)

        // NOTE: Adding this now will result in `mid === 2`
        this._transceiverScreenVideo = this._pc.addTransceiver("video", {
            direction: "sendrecv",
            sendEncodings: [this._transceiverScreenVideoParameters],
        })
        this._configure_transceiverScreenVideo(this._transceiverScreenVideo)
        this._transceiverScreenVideo.sender.replaceTrack(this._localTrackScreenVideo)

        // NOTE: Adding this now will result in `mid === 3`
        this._transceiverScreenAudio = this._pc.addTransceiver("audio", {
            direction: "sendrecv",
            sendEncodings: [this._transceiverScreenAudioParameters],
        })
        this._configure_transceiverScreenAudio(this._transceiverScreenAudio)
        this._transceiverScreenAudio.sender.replaceTrack(this._localTrackScreenAudio)
    }

    /**
     * Close the connection and cleanup resources.
     */
    closeConnection() {
        this.INFO("closeConnection()")

        this._pc.close()

        this.onsignalingstatechange(this._pc.signalingState)
        this.onicegatheringstatechange(this._pc.iceGatheringState)
        this.oniceconnectionstatechange(this._pc.iceConnectionState)
        this.onconnectionstatechange(this._pc.connectionState)
    }

    /* ============================================================================================================== */

    private readonly _transceiverMicAudioParameters: RTCRtpEncodingParameters = {
        // maxBitrate?: number;
        networkPriority: "high",
        priority: "high",
    }
    private readonly _transceiverCamVideoParameters: RTCRtpEncodingParameters = {
        maxFramerate: 30,
        maxBitrate: 2_500_000, // 2_000_000 before, then 1_500_000
        networkPriority: "medium",
        priority: "medium",
    }
    private readonly _transceiverScreenVideoParameters: RTCRtpEncodingParameters = {
        maxFramerate: 60,
        maxBitrate: 10_000_000, // 10_000_000 before, then 12_000_000
        networkPriority: "medium",
        priority: "medium",
    }
    private readonly _transceiverScreenAudioParameters: RTCRtpEncodingParameters = {
        // maxBitrate?: number;
        networkPriority: "low",
        priority: "low",
    }

    /* ============================================================================================================== */

    /**
     * Helper function to get sender parameters with retry logic
     * @param transceiver The RTCRtpTransceiver to get parameters from
     * @param debugName Name for debugging purposes
     * @returns Promise with the sender parameters
     */
    private async _getSenderParametersWithRetry(
        transceiver: RTCRtpTransceiver,
        debugName: string,
    ): Promise<RTCRtpSendParameters> {
        return new Promise<RTCRtpSendParameters>((resolve, reject) => {
            let i = 0
            const interval = setInterval(() => {
                const parameters = transceiver.sender.getParameters()
                console.debug(`polling _configure_${debugName}`, parameters)
                if (parameters.encodings.length > 0) {
                    clearInterval(interval)
                    resolve(parameters)
                }
                i++
                if (i >= 50) {
                    clearInterval(interval)
                    reject(`Could not get parameters for ${debugName} after 50 tries`)
                }
            }, 100)
        })
    }

    private async _configure_transceiverMicAudio(transceiver: RTCRtpTransceiver) {
        if (sortedCodecsAudio !== null) {
            try {
                transceiver.setCodecPreferences(sortedCodecsAudio)
            } catch (error) {
                this.ERROR("transceiverMicAudio.setCodecPreferences() error:", error)
            }
        }

        try {
            const parameters = await this._getSenderParametersWithRetry(transceiver, "transceiverMicAudio")
            Object.assign(parameters.encodings[0]!, this._transceiverMicAudioParameters)
            await transceiver.sender.setParameters(parameters)
        } catch (error) {
            this.ERROR("transceiverMicAudio.setParameters() error:", error)
        }
    }

    private async _configure_transceiverCamVideo(transceiver: RTCRtpTransceiver) {
        if (sortedCodecsVideo !== null) {
            try {
                transceiver.setCodecPreferences(sortedCodecsVideo)
            } catch (error) {
                this.ERROR("transceiverCamVideo.setCodecPreferences() error:", error)
            }
        }

        try {
            const parameters = await this._getSenderParametersWithRetry(transceiver, "transceiverCamVideo")
            parameters.degradationPreference = "maintain-resolution"
            Object.assign(parameters.encodings[0]!, this._transceiverCamVideoParameters)
            await transceiver.sender.setParameters(parameters)
        } catch (error) {
            this.ERROR("transceiverCamVideo.setParameters() error:", error)
        }
    }

    private async _configure_transceiverScreenVideo(transceiver: RTCRtpTransceiver) {
        if (sortedCodecsVideo !== null) {
            try {
                transceiver.setCodecPreferences(sortedCodecsVideo)
            } catch (error) {
                this.ERROR("transceiverScreenVideo.setCodecPreferences() error:", error)
            }
        }

        try {
            const parameters = await this._getSenderParametersWithRetry(transceiver, "transceiverScreenVideo")
            parameters.degradationPreference = "maintain-framerate"
            Object.assign(parameters.encodings[0]!, this._transceiverScreenVideoParameters)
            await transceiver.sender.setParameters(parameters)
        } catch (error) {
            this.ERROR("transceiverScreenVideo.setParameters() error:", error)
        }
    }

    private async _configure_transceiverScreenAudio(transceiver: RTCRtpTransceiver) {
        if (sortedCodecsAudio !== null) {
            try {
                transceiver.setCodecPreferences(sortedCodecsAudio)
            } catch (error) {
                this.ERROR("transceiverScreenAudio.setCodecPreferences() error:", error)
            }
        }

        try {
            const parameters = await this._getSenderParametersWithRetry(transceiver, "transceiverScreenAudio")
            Object.assign(parameters.encodings[0]!, this._transceiverScreenAudioParameters)
            await transceiver.sender.setParameters(parameters)
        } catch (error) {
            this.ERROR("transceiverScreenAudio.setParameters() error:", error)
        }
    }
}
