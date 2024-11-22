/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    TRANSCEIVER_MID_MIC_AUDIO,
    TRANSCEIVER_MID_CAM_VIDEO,
    TRANSCEIVER_MID_SCREEN_VIDEO,
    TRANSCEIVER_MID_SCREEN_AUDIO,
} from "./peer/PeerConnection.svelte"

/* ================================================================================================================== */
// MARK: Constrants

const KEYS_TO_DIFF = [
    "bytesSent",
    "packetsSent",
    "headerBytesSent",
    "packetsLost",
    "packetsReceived",
    "bytesReceived",
    "headerBytesReceived",
]
const KEYS_TO_SUM = [
    "bytesSent",
    "packetsSent",
    "headerBytesSent",
    "packetsLost",
    "packetsReceived",
    "bytesReceived",
    "headerBytesReceived",
]

/* ================================================================================================================== */
// MARK: Types

export type Recv = {
    timestamp: number

    packetsLost: number
    packetsReceived: number
    bytesReceived: number
    headerBytesReceived: number
}
function parse_recv(stats: RawStats): Recv {
    return {
        timestamp: stats.timestamp ?? null,

        packetsLost: stats.packetsLost ?? null,
        packetsReceived: stats.packetsReceived ?? null,
        bytesReceived: stats.bytesReceived ?? null,
        headerBytesReceived: stats.headerBytesReceived ?? null,
    }
}

export type Sent = {
    timestamp: number

    targetBitrate: number

    bytesSent: number
    packetsSent: number
    headerBytesSent: number
}
function parse_sent(stats: RawStats): Sent {
    return {
        timestamp: stats.timestamp ?? null,

        targetBitrate: stats.targetBitrate ?? null,

        bytesSent: stats.bytesSent ?? null,
        packetsSent: stats.packetsSent ?? null,
        headerBytesSent: stats.headerBytesSent ?? null,
    }
}

export type Audio = object
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parse_audio(stats: RawStats): Audio {
    return {}
}

export type Video = {
    // TODO: width and height are not correct of vertical front-facing mobile video
    frameWidth: number | null
    frameHeight: number | null
    framesPerSecond: number | null
}
function parse_video(stats: RawStats): Video {
    return {
        frameWidth: stats.frameWidth ?? null,
        frameHeight: stats.frameHeight ?? null,
        framesPerSecond: stats.framesPerSecond ?? null,
    }
}

/* ================================================================================================================== */
// MARK: Parsing

type RawStats = Record<string, any>
function parseRecvAudio(stat: RawStats): Recv & Audio {
    return {
        ...parse_recv(stat),
        ...parse_audio(stat),
    }
}
function parseRecvVideo(stat: RawStats): Recv & Video {
    return {
        ...parse_recv(stat),
        ...parse_video(stat),
    }
}
function parseSentAudio(stat: RawStats): Sent & Audio {
    return {
        ...parse_sent(stat),
        ...parse_audio(stat),
    }
}
function parseSentVideo(stat: RawStats): Sent & Video {
    return {
        ...parse_sent(stat),
        ...parse_video(stat),
    }
}

/* ================================================================================================================== */
// MARK: Calculations

function difference<T>(list: T[], selected: string[]): T {
    if (list.length === 0) return {} as T
    if (list.length === 1) return list[0]!

    const first = list[0] as Record<string, number> // T extends Record<string, number>
    const last = list[list.length - 1] as Record<string, number> // T extends Record<string, number>

    const result: Record<string, number> = {}
    for (const key of Object.keys(last)) {
        if (selected.includes(key)) {
            result[key] = last[key]! - (first[key] ?? 0)
        } else {
            result[key] = last[key]!
        }
    }
    return result as T
}

function sum(list: Record<string, number>[], selected: string[]): Record<string, number> {
    if (list.length === 0) return {}
    if (list.length === 1) return list[0]!

    const result: Record<string, number> = Object.fromEntries(selected.map((key) => [key, 0]))
    for (const item of list) {
        for (const key of selected) {
            result[key]! += item[key]!
        }
    }

    return result
}

/* ================================================================================================================== */
// MARK: class Stats

export class Stats {
    // INFO: The lists are used to calculate the value difference
    private _mic_audio_recv_list: (Recv & Audio)[] = []
    private _cam_video_recv_list: (Recv & Video)[] = []
    private _screen_video_recv_list: (Recv & Video)[] = []
    private _screen_audio_recv_list: (Recv & Audio)[] = []
    private _mic_audio_sent_list: (Sent & Audio)[] = []
    private _cam_video_sent_list: (Sent & Video)[] = []
    private _screen_video_sent_list: (Sent & Video)[] = []
    private _screen_audio_sent_list: (Sent & Audio)[] = []

    /* ============================================================================================================== */

    // INFO: The value difference
    private _mic_audio_recv: (Recv & Audio) | null = $state(null)
    private _cam_video_recv: (Recv & Video) | null = $state(null)
    private _screen_video_recv: (Recv & Video) | null = $state(null)
    private _screen_audio_recv: (Recv & Audio) | null = $state(null)
    private _mic_audio_sent: (Sent & Audio) | null = $state(null)
    private _cam_video_sent: (Sent & Video) | null = $state(null)
    private _screen_video_sent: (Sent & Video) | null = $state(null)
    private _screen_audio_sent: (Sent & Audio) | null = $state(null)

    // INFO: The sum of all the value difference
    private _general_recv: Recv | null = $state(null)
    private _general_sent: Sent | null = $state(null)

    public get mic_audio_recv() {
        return this._mic_audio_recv
    }
    public get cam_video_recv() {
        return this._cam_video_recv
    }
    public get screen_video_recv() {
        return this._screen_video_recv
    }
    public get screen_audio_recv() {
        return this._screen_audio_recv
    }

    public get mic_audio_sent() {
        return this._mic_audio_sent
    }
    public get cam_video_sent() {
        return this._cam_video_sent
    }
    public get screen_video_sent() {
        return this._screen_video_sent
    }
    public get screen_audio_sent() {
        return this._screen_audio_sent
    }

    public get general_sent() {
        return this._general_sent
    }
    public get general_recv() {
        return this._general_recv
    }

    /* ============================================================================================================== */

    /** The average should be calculated over this many seconds. */
    public readonly averaged_seconds: number

    /* ============================================================================================================== */
    // MARK: Constructor

    constructor(
        /** The {@link RTCPeerConnection} of which to monitor the stats. */
        private readonly peerConnection: RTCPeerConnection,
        /** Every how many milliseconds the stats should be inspected and updated. */
        private readonly interval: number = 500,
        /** The average is calculated over this many iterations (has to be `>=2` to make sense). */
        private readonly average: number = 11,
    ) {
        // NOTE: `this.average - 1`, because when we average over `2` iterations, we have a `1s` timespan
        this.averaged_seconds = (this.average - 1) * (this.interval / 1000)
    }

    /* ============================================================================================================== */

    private _interval: ReturnType<typeof setInterval> | null = null

    /**
     * Start the data fetching loop from the `RTCPeerConnection` (uses `setInterval`).
     *
     * Does nothing if already started.
     */
    public start() {
        if (this._interval) return

        this._interval = setInterval(async () => {
            const report = await this.peerConnection.getStats()
            this.update(report)
        }, this.interval)
    }

    /**
     * Stop the data fetching loop from the `RTCPeerConnection` (uses `clearInterval`).
     *
     * Does nothing if already stopped.
     */
    public stop() {
        if (this._interval) {
            clearInterval(this._interval)
            this._interval = null
        }
    }

    /* ============================================================================================================== */
    // MARK: update()

    /** Should be called in an interval */
    private update(report: RTCStatsReport) {
        // console.log(Array.from(report.values()))

        for (const stat of report.values()) {
            if (stat.type === "inbound-rtp") {
                if (stat.mid === TRANSCEIVER_MID_MIC_AUDIO) {
                    this._mic_audio_recv_list.push(parseRecvAudio(stat))
                    if (this._mic_audio_recv_list.length > this.average) this._mic_audio_recv_list.shift()
                    this._mic_audio_recv = difference(this._mic_audio_recv_list, KEYS_TO_DIFF)
                } else if (stat.mid === TRANSCEIVER_MID_CAM_VIDEO) {
                    this._cam_video_recv_list.push(parseRecvVideo(stat))
                    if (this._cam_video_recv_list.length > this.average) this._cam_video_recv_list.shift()
                    this._cam_video_recv = difference(this._cam_video_recv_list, KEYS_TO_DIFF)
                } else if (stat.mid === TRANSCEIVER_MID_SCREEN_VIDEO) {
                    this._screen_video_recv_list.push(parseRecvVideo(stat))
                    if (this._screen_video_recv_list.length > this.average) this._screen_video_recv_list.shift()
                    this._screen_video_recv = difference(this._screen_video_recv_list, KEYS_TO_DIFF)
                } else if (stat.mid === TRANSCEIVER_MID_SCREEN_AUDIO) {
                    this._screen_audio_recv_list.push(parseRecvAudio(stat))
                    if (this._screen_audio_recv_list.length > this.average) this._screen_audio_recv_list.shift()
                    this._screen_audio_recv = difference(this._screen_audio_recv_list, KEYS_TO_DIFF)
                }
            } else if (stat.type === "outbound-rtp") {
                if (stat.mid === TRANSCEIVER_MID_MIC_AUDIO) {
                    this._mic_audio_sent_list.push(parseSentAudio(stat))
                    if (this._mic_audio_sent_list.length > this.average) this._mic_audio_sent_list.shift()
                    this._mic_audio_sent = difference(this._mic_audio_sent_list, KEYS_TO_DIFF)
                } else if (stat.mid === TRANSCEIVER_MID_CAM_VIDEO) {
                    this._cam_video_sent_list.push(parseSentVideo(stat))
                    if (this._cam_video_sent_list.length > this.average) this._cam_video_sent_list.shift()
                    this._cam_video_sent = difference(this._cam_video_sent_list, KEYS_TO_DIFF)
                } else if (stat.mid === TRANSCEIVER_MID_SCREEN_VIDEO) {
                    this._screen_video_sent_list.push(parseSentVideo(stat))
                    if (this._screen_video_sent_list.length > this.average) this._screen_video_sent_list.shift()
                    this._screen_video_sent = difference(this._screen_video_sent_list, KEYS_TO_DIFF)
                } else if (stat.mid === TRANSCEIVER_MID_SCREEN_AUDIO) {
                    this._screen_audio_sent_list.push(parseSentAudio(stat))
                    if (this._screen_audio_sent_list.length > this.average) this._screen_audio_sent_list.shift()
                    this._screen_audio_sent = difference(this._screen_audio_sent_list, KEYS_TO_DIFF)
                }
            }
        }

        // NOTE: using "x is not null" because svelte-check does not understand it, although it is using typescript>5
        this._general_recv = sum(
            [this._mic_audio_recv, this._cam_video_recv, this._screen_video_recv, this._screen_audio_recv].filter(
                (x): x is Recv => x !== null,
            ),
            KEYS_TO_SUM,
        ) as Recv
        this._general_sent = sum(
            [this._mic_audio_sent, this._cam_video_sent, this._screen_video_sent, this._screen_audio_sent].filter(
                (x): x is Sent => x !== null,
            ),
            KEYS_TO_SUM,
        ) as Sent
    }
}
