import { NoiseSuppressorWorklet_Name } from "@timephy/rnnoise-wasm"
// NOTE: `?worker&url` is important (`worker` to generate a working script, `url` to get its url to load it)
import NoiseSuppressorWorklet from "@timephy/rnnoise-wasm/NoiseSuppressorWorklet?worker&url"

/* ============================================================================================== */

// Exponential Moving Average (EMA) for smoothing the volume meter
// 1 = no smoothing, 0 = max smoothing (no change)
// NOTE: The smooting is also influenced by the frequency of the update loop (setInterval)
const smoothingFactor = 0.125
const smoothingFactorOutput = 0.075

const gateReleaseTime = 400 // Time in milliseconds for the gate to remain open after the volume drops below the threshold
const attackTime = 0.04 // Time in seconds for the gate to fully open
const releaseTime = 0.2 // Time in seconds for the gate to fully close
const epsilon = 1e-10

const MIN_VOLUME = 20 * Math.log10(epsilon) // -200 dB

/* ============================================================================================== */

const LOCK = (cb: () => Promise<void>) => {
    return navigator.locks.request("tui-rtc.pipeline", cb)
}

/* ============================================================================================== */

const DEBUG = (...msgs: unknown[]) => {
    console.debug("[AudioPipeline]", ...msgs)
}
const WARN = (...msgs: unknown[]) => {
    console.warn("[AudioPipeline]", ...msgs)
}

/* ============================================================================================== */

/**
 * An audio pipeline that processes audio data.
 * Useful for voice call applications.
 *
 * The pipeline consists of the following steps:
 * - Input
 *   - merge to mono
 *   - measure volume
 * - Noise Suppression (RNNoise) *[optional]*
 * - Volume Gate *[optional]*
 *   - measure volume
 *   - gated passthrough
 * - Gain (volume multiplier)
 * - Output
 *   - measure volume
 *   - playback on local audio output *[optional]*
 */
export class AudioPipeline {
    /* ========================================================================================== */
    /*                                          Settings                                          */
    /* ========================================================================================== */

    /** If should measure volume of the source. */
    #debug: boolean = false

    // !! Noise Suppression
    /**
     * If the noise suppression worket has been added successfully (`audioContext.audioWorklet.addModule(NoiseSuppressorWorklet)`).
     *
     * - `true`: success
     * - `false`: error
     * - `null`: not loaded yet
     */
    #noiseSuppressionLoaded: boolean | null = $state(null)
    /** If noise suppression is enabled (RNNoise should be applied on the source). */
    #noiseSuppression: boolean = $state(false)

    // !! Volume Gate
    /** If a volume (in dB) is given, a volume gate will be applied on the (maybe noise suppressed) source. */
    #volumeGate: number | null = $state(null)
    /** If the volume gate is currently open. */
    #volumeGateOpen: boolean = $state(false)

    // !! Output
    /** Gain multiplier, applied to the output. */
    #gain: number = $state(1)
    /** If should play the output audio on the local audio output (speakers/headphones). */
    #playback: boolean = $state(false)

    /* ========================================================================================== */
    /*                                           Volumes                                          */
    /* ========================================================================================== */

    /** Volume measured from the source, if debug is `true`. */
    #volumeSource: number | null = $state(null)
    /** Volume measured from the (maybe noise suppressed) source, if `#volumeGate !== null`. */
    #volumeVoice: number = $state(MIN_VOLUME)
    /** Volume measured from the output. */
    #volume: number = $state(MIN_VOLUME)

    /* ========================================================================================== */

    // !! Used for Volume measurement (loop)
    #interval: ReturnType<typeof setInterval> | null = null
    #volumeGateTimeout: ReturnType<typeof setTimeout> | null = null

    /* ========================================================================================== */

    readonly #ctx = new AudioContext({
        latencyHint: "interactive",
        sampleRate: 48000,
    })

    readonly #nodes = {
        source: null as MediaStreamAudioSourceNode | null,
        // NOTE: This combines both channels into one, and splits it back out to two when connected to the next node
        sourceMerger: this.#ctx.createChannelMerger(1),
        sourceAnalyser: this.#debug ? this.#ctx.createAnalyser() : null,
        rnnoise: null as AudioWorkletNode | null,
        voiceAnalyser: this.#ctx.createAnalyser(),
        gate: this.#volumeGate ? this.#ctx.createBiquadFilter() : null,
        gainNode: this.#ctx.createGain(),
        analyser: this.#ctx.createAnalyser(),
        output: this.#ctx.createMediaStreamDestination(),
    }

    /* ========================================================================================== */

    constructor({
        noiseSuppression = false,
        volumeGate = null,
        gain = 1,
        debug = false,
        playback = false,
    }: {
        noiseSuppression?: boolean
        volumeGate?: number | null
        gain?: number
        debug?: boolean
        playback?: boolean
    }) {
        DEBUG(`new AudioPipeline({
    noiseSuppression=${noiseSuppression},
    volumeGate=${volumeGate},
    gain=${gain},
    debug=${debug},
    playback=${playback},
})`)

        // Set options
        this.#set_debug(debug)
        this.#set_volumeGate(volumeGate)
        this.#set_gain(gain)
        this.#set_playback(playback)
        // `_set_noiseSuppression` is the only async setter, so run it behind the lock
        this.#noiseSuppression = noiseSuppression
        LOCK(async () => {
            await this.#set_noiseSuppression(noiseSuppression)
        })
    }

    /**
     * Destroy the pipeline.
     *
     * After calling this method, the instance should not be used anymore.
     */
    async destroy() {
        this.#stopUpdate()
        await this.#ctx.close()
    }

    /* ========================================================================================== */

    /**
     * Loads the noise suppression audio worklet.
     *
     * - On successful load `_noiseSuppressionLoaded` is set to `true`.
     * - If the worklet is already loaded, this function does nothing.
     */
    async #load_noise_suppression(): Promise<void> {
        DEBUG("Load NoiseSuppressorWorklet")

        if (this.#noiseSuppressionLoaded === true) {
            DEBUG("NoiseSuppressorWorklet already loaded")
            return
        }

        try {
            const timeBefore = Date.now()
            DEBUG("audioContext.audioWorklet.addModule()", NoiseSuppressorWorklet)
            await this.#ctx.audioWorklet.addModule(NoiseSuppressorWorklet)
            this.#noiseSuppressionLoaded = true
            DEBUG(`NoiseSuppressorWorklet loaded successfully after ${Date.now() - timeBefore}ms`)
        } catch (error) {
            WARN("NoiseSuppressorWorklet load error:", error)
            this.#noiseSuppressionLoaded = false
        }
    }

    /* ========================================================================================== */

    /**
     * Reconfigure the pipeline with the current track and settings.
     *
     * - Reconnects all nodes
     * - Starts the volume measurement and volume gate loop
     *
     * Should be called after the track or any settings change.
     */
    #reconnect() {
        DEBUG("reconnect()")
        const Nodes = this.#nodes

        // !! Config
        Nodes.sourceAnalyser && (Nodes.sourceAnalyser.fftSize = 2048)
        Nodes.voiceAnalyser.fftSize = 2048
        Nodes.gate && (Nodes.gate.type = "lowpass")
        // TODO: is this right? - seems so... works well
        Nodes.gate && (Nodes.gate.frequency.value = 0) // Initially disable the audio
        Nodes.analyser.fftSize = 2048
        Nodes.gainNode.gain.value = this.#gain

        // !! Disconnect all
        Nodes.source?.disconnect()
        Nodes.sourceMerger.disconnect()
        Nodes.sourceAnalyser?.disconnect()
        Nodes.rnnoise?.disconnect()
        Nodes.voiceAnalyser.disconnect()
        Nodes.gate?.disconnect()
        Nodes.gainNode.disconnect()
        Nodes.analyser.disconnect()
        Nodes.output.disconnect()

        // !! If not input has been set, no need to do anything
        if (!Nodes.source) {
            this.#stopUpdate()
            return
        }

        // !! Connect all nodes
        let node: AudioNode = Nodes.source

        node = node.connect(Nodes.sourceMerger)
        if (Nodes.sourceAnalyser) {
            // DEBUG("connect sourceAnalyser")
            node = node.connect(Nodes.sourceAnalyser)
        }
        // NOTE: this `if` is different, because we keep the `rnnoise` node when `noiseSuppression` gets disabled
        if (this.#noiseSuppression && Nodes.rnnoise) {
            // DEBUG("connect rnnoise")
            node = node.connect(Nodes.rnnoise)
        }
        // DEBUG("connect voiceAnalyser")
        node = node.connect(Nodes.voiceAnalyser)
        if (Nodes.gate) {
            // DEBUG("connect gate")
            node = node.connect(Nodes.gate)
        }
        node = node.connect(Nodes.gainNode)
        node = node.connect(Nodes.analyser)

        // output
        node.connect(Nodes.output)
        // playback
        if (this.#playback) node.connect(this.#ctx.destination)

        // !! Detect Volume
        const sourcePcmData = Nodes.sourceAnalyser
            ? new Float32Array(Nodes.sourceAnalyser.fftSize)
            : null
        const voicePcmData = new Float32Array(Nodes.voiceAnalyser.fftSize)
        const pcmData = new Float32Array(Nodes.analyser.fftSize)

        const update = () => {
            // !! Measure Source Volume
            if (sourcePcmData) {
                Nodes.sourceAnalyser?.getFloatTimeDomainData(sourcePcmData)
                let sumSquares = sourcePcmData.reduce(
                    (sum, amplitude) => sum + amplitude * amplitude,
                    0,
                )
                const instantSourceVolume = Math.sqrt(sumSquares / sourcePcmData.length)
                const sourceVolumeDb = 20 * Math.log10(instantSourceVolume + epsilon) // Convert to dB
                this.#volumeSource =
                    smoothingFactor * sourceVolumeDb +
                    (1 - smoothingFactor) * (this.#volumeSource ?? MIN_VOLUME)
            } else if (this.#volumeSource !== null) {
                this.#volumeSource = null
            }
            // !! Measure Voice Volume
            if (voicePcmData) {
                Nodes.voiceAnalyser.getFloatTimeDomainData(voicePcmData)
                let sumSquares = voicePcmData.reduce(
                    (sum, amplitude) => sum + amplitude * amplitude,
                    0,
                )
                const instantVoiceVolume = Math.sqrt(sumSquares / voicePcmData.length)
                const voiceVolumeDb = 20 * Math.log10(instantVoiceVolume + epsilon) // Convert to dB
                this.#volumeVoice =
                    smoothingFactor * voiceVolumeDb +
                    (1 - smoothingFactor) * (this.#volumeVoice ?? MIN_VOLUME)
            }
            // !! Measure Output Volume
            {
                Nodes.analyser.getFloatTimeDomainData(pcmData)
                let sumSquares = pcmData.reduce((sum, amplitude) => sum + amplitude * amplitude, 0)
                const instantVolume = Math.sqrt(sumSquares / pcmData.length)
                const volumeDb = 20 * Math.log10(instantVolume + epsilon) // Convert to dB
                this.#volume =
                    smoothingFactorOutput * volumeDb + (1 - smoothingFactorOutput) * this.#volume
            }

            // !! Open/Close Volume Gate
            if (
                this.#volumeGate === null ||
                (this.#volumeVoice !== null && this.#volumeVoice > this.#volumeGate)
            ) {
                // should be open if volumeGate is null or voiceVolume is above the threshold
                this.#volumeGateOpen = true
                Nodes.gate?.frequency.setTargetAtTime(20000, this.#ctx.currentTime, attackTime)
                if (this.#volumeGateTimeout) {
                    clearTimeout(this.#volumeGateTimeout)
                    this.#volumeGateTimeout = null
                }
            } else if (this.#volumeGateTimeout === null) {
                this.#volumeGateTimeout = setTimeout(() => {
                    this.#volumeGateOpen = false
                    Nodes.gate?.frequency.setTargetAtTime(0, this.#ctx.currentTime, releaseTime)
                    this.#volumeGateTimeout = null
                }, gateReleaseTime)
            }
        }

        // !! Start Loop
        if (this.#interval !== null) clearInterval(this.#interval)
        this.#interval = setInterval(update, 7)
    }

    /** Stop the volume measurement and volume gate loop. */
    #stopUpdate() {
        if (this.#interval !== null) {
            clearInterval(this.#interval)
            this.#interval = null
        }
        // Reset volume to `MIN_VOLUME`, otherwise this freezes the volume meter at the last value
        this.#volumeSource = this.#debug ? MIN_VOLUME : null
        this.#volumeVoice = MIN_VOLUME
        this.#volume = MIN_VOLUME
        this.#volumeGateOpen = false
    }

    /* ========================================================================================== */
    /*                                        set functions                                       */
    /* ========================================================================================== */

    #set_track(track: MediaStreamTrack | null) {
        this.#nodes.source?.disconnect()
        this.#nodes.source = track
            ? this.#ctx.createMediaStreamSource(new MediaStream([track]))
            : null

        this.#reconnect()
    }

    #set_debug(_debug: boolean) {
        this.#debug = _debug

        this.#volumeSource = this.#debug ? MIN_VOLUME : null
        this.#nodes.sourceAnalyser = this.#debug ? this.#ctx.createAnalyser() : null
        this.#reconnect()
    }

    async #set_noiseSuppression(_noiseSuppression: boolean) {
        this.#noiseSuppression = _noiseSuppression

        if (this.#noiseSuppression && !this.#nodes.rnnoise) {
            await this.#load_noise_suppression()
            // if load was successful, instantiate node
            if (this.#noiseSuppressionLoaded === true) {
                this.#nodes.rnnoise = new AudioWorkletNode(this.#ctx, NoiseSuppressorWorklet_Name)
            }
        }
        this.#reconnect()
    }

    #set_volumeGate(_volumeGate: number | null) {
        const gatedBefore = this.#volumeGate !== null
        this.#volumeGate = _volumeGate
        const gatedNow = this.#volumeGate !== null

        if (gatedNow !== gatedBefore) {
            if (gatedNow) {
                this.#nodes.gate = this.#ctx.createBiquadFilter()
            } else {
                this.#nodes.gate?.disconnect()
                this.#nodes.gate = null
            }
            this.#reconnect()
            this.#volumeGateOpen = this.#volumeGate === null ? true : false
            this.#volumeVoice = MIN_VOLUME
        }
    }

    #set_gain(_gain: number) {
        this.#gain = _gain

        this.#nodes.gainNode.gain.value = this.#gain
    }

    #set_playback(_playback: boolean) {
        if (_playback !== this.#playback) {
            this.#playback = _playback

            if (this.#playback) {
                this.#nodes.analyser.connect(this.#ctx.destination)
            } else {
                this.#nodes.analyser.disconnect(this.#ctx.destination)
            }
        }
    }

    /* ========================================================================================== */
    /*                                           Exports                                          */
    /* ========================================================================================== */

    /**
     * Set the source track for the pipeline.
     *
     * This is usually the direct input from the microphone, or the received audio track from a voice call.
     */
    async setTrack(track: MediaStreamTrack | null) {
        await LOCK(async () => {
            // NOTE: In Chrome, an AudioContext is not allowed to start before a user interaction,
            // NOTE: therefore it is sensible to try to resume it every time a new track is set, just to make sure
            await this.#ctx.resume()

            DEBUG("setTrack", track)
            this.#set_track(track)
            DEBUG("setTrack", "end")
        })
    }

    /** If the input source signal volume should be measured. */
    get debug() {
        return this.#debug
    }
    set debug(_debug) {
        LOCK(async () => {
            DEBUG(`debug = ${_debug}`)
            this.#set_debug(_debug)
            DEBUG(`debug = ${_debug} end`)
        })
    }

    /* ==================================== Noise Suppression =================================== */

    /** If noise suppression should be applied to the input signal. */
    get noiseSuppression() {
        return this.#noiseSuppression
    }
    set noiseSuppression(_noiseSuppression) {
        LOCK(async () => {
            DEBUG(`noiseSuppression = ${_noiseSuppression}`)
            await this.#set_noiseSuppression(_noiseSuppression)
            DEBUG(`noiseSuppression = ${_noiseSuppression} end`)
        })
    }
    /**
     * If the noise suppression worket has been added successfully (`audioContext.audioWorklet.addModule(NoiseSuppressorWorklet)`).
     *
     * - `true`: success
     * - `false`: error
     * - `null`: not loaded yet
     */
    get noiseSuppressionLoaded() {
        return this.#noiseSuppressionLoaded
    }

    /* ======================================= Volume Gate ====================================== */

    /**
     * If a volume gate should be applied to the input signal, this is the threshold in dB.
     */
    get volumeGate() {
        return this.#volumeGate
    }
    set volumeGate(_volumeGate) {
        LOCK(async () => {
            DEBUG(`volumeGate = ${_volumeGate}`)
            this.#set_volumeGate(_volumeGate)
            DEBUG(`volumeGate = ${_volumeGate} end`)
        })
    }

    /**
     * If the `volumeGate` is currently open and lets audio pass.
     *
     * The effect on the audio has a transition delay compared to this value.
     */
    get volumeGateOpen() {
        return this.#volumeGateOpen
    }

    /* ========================================= Volume ========================================= */

    /** The volume of the input source (only measured when `debug = true`). */
    get volumeSource() {
        return this.#volumeSource
    }
    /** The volume of the voice signal (after `noiseSuppression`, only measured when `volumeGate !== null`). */
    get volumeVoice() {
        return this.#volumeVoice
    }
    /** The volume of the output signal (after `noiseSuppression`, `volumeGate` and `gain`). */
    get volume() {
        return this.#volume
    }

    /* ========================================= Output ========================================= */

    /** The volume multiplier applied as the last step to the output signal. */
    get gain() {
        return this.#gain
    }
    set gain(_gain) {
        DEBUG(`gain = ${_gain}`)
        this.#set_gain(_gain)
        DEBUG(`gain = ${_gain} end`)
    }

    /** If the output signal should be played on the local audio output (speaker/headphones). */
    get playback() {
        return this.#playback
    }
    set playback(_playback) {
        LOCK(async () => {
            DEBUG(`playback = ${_playback}`)
            this.#set_playback(_playback)
            DEBUG(`playback = ${_playback} end`)
        })
    }

    /** The output signal. */
    get output() {
        const track = this.#nodes.output.stream.getAudioTracks()[0]
        if (track === undefined) {
            // this should never happen because the output of the AudioPipeline should always have an audio track
            throw "_mic_pipeline.output is undefined"
        }
        return track
    }
}
