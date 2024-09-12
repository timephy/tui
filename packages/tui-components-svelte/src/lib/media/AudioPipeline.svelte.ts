import { NoiseSuppressorWorklet_Name } from "@timephy/rnnoise-wasm"
// NOTE: `?worker&url` is important (`worker` to generate a working script, `url` to get its url to load it)
import NoiseSuppressorWorklet from "@timephy/rnnoise-wasm/NoiseSuppressorWorklet?worker&url"

import {
    calculateVolume,
    GATE_THRESHOLD_PARAM,
    MIN_VOLUME,
    scaleVolume,
    SMOOTHING_FACTOR,
    VolumeMeterGateWorklet_Name,
    type VolumeMeterGateMessage,
} from "./volume"
// NOTE: `?worker&url` is important (`worker` to generate a working script, `url` to get its url to load it)
import VolumeMeterGateWorklet from "./volume/VolumeMeterGateWorklet?worker&url"

/* ================================================================================================================== */
/*                                                        Locks                                                       */
/* ================================================================================================================== */

const LOCK = (cb: () => Promise<void>) => {
    return navigator.locks.request("tui-rtc.pipeline", cb)
}

/* ================================================================================================================== */
/*                                                       Console                                                      */
/* ================================================================================================================== */

const DEBUG = (...msgs: unknown[]) => {
    console.debug("[AudioPipeline]", ...msgs)
}
const WARN = (...msgs: unknown[]) => {
    console.warn("[AudioPipeline]", ...msgs)
}

/* ================================================================================================================== */
/*                                                    AudioPipeline                                                   */
/* ================================================================================================================== */

/**
 * An audio pipeline that processes audio data.
 * Useful for voice call applications.
 *
 * The pipeline consists of the following steps:
 * - **Noise Suppression**: Reduces background noise.
 * - **Volume Meter Gate**: Measures the volume of the input and gates the output based on the volume.
 * - **Gain**: Multiplies the output volume.
 */
export class AudioPipeline {
    // MARK: Variables (debug)

    /** If should measure volume of the source. */
    #debug: boolean = false

    /** Volume measured from the source, if debug is `true`. */
    #debugVolumeSource: number | null = $state(null)
    /** Volume measured from the source, if debug is `true`. */
    #debugVolumeOutput: number | null = $state(null)

    #debugGateFactor = $state(0)

    /* ============================================================================================================== */
    // MARK: Variables

    // ! AudioWorklets
    /**
     * If the noise suppression worket has been added successfully (`audioContext.audioWorklet.addModule(NoiseSuppressorWorklet)`).
     *
     * - `true`: success
     * - `false`: error
     * - `null`: not loaded yet
     */
    #noiseSuppressionLoaded: boolean | null = $state(null)
    /**
     * If the volume meter gate worket has been added successfully (`audioContext.audioWorklet.addModule(VolumeMeterGateWorklet)`).
     *
     * - `true`: success
     * - `false`: error
     * - `null`: not loaded yet
     */
    #volumeMeterGateLoaded: boolean | null = $state(null)

    // ! Noise Suppression
    /** If noise suppression is enabled. */
    #noiseSuppression: boolean = $state(false)

    // ! Volume Gate
    /** If a volume (in dB) is given, a volume gate will be applied on the (maybe noise suppressed) source. */
    #volumeGate: number | null = $state(null)
    /** If the volume gate is currently open. */
    #volumeGateOpen: boolean = $state(false)

    // ! Output
    /** Gain multiplier, applied to the output. */
    #gain: number = $state(1)
    /** If should play the output audio on the local audio output (speakers/headphones). */
    #playback: boolean = $state(false)

    // ! Volumes

    /** Voice volume measured by `volumeMeterGate` (after noise suppression, before volume gate). */
    #volumeVoice: number = $state(MIN_VOLUME)
    /** Output Volume calculated with scaled by gain. */
    #volume: number = $state(MIN_VOLUME)

    /* ============================================================================================================== */

    /** Used for debug volume measurement loop. */
    #interval: ReturnType<typeof setInterval> | null = null

    /* ============================================================================================================== */
    // MARK: Context + Nodes

    readonly #ctx = new AudioContext({
        latencyHint: "interactive",
        sampleRate: 48000,
    })

    readonly #nodes = {
        source: null as MediaStreamAudioSourceNode | null,
        mergeChannels: this.#ctx.createChannelMerger(1), // NOTE: This combines both channels into one, and splits it back out to two when connected to the next node
        debugVolumeSource: this.#debug ? this.#ctx.createAnalyser() : null,

        noiseSupression: null as AudioWorkletNode | null,
        volumeMeterGate: null as AudioWorkletNode | null,

        gain: this.#ctx.createGain(),
        debugVolumeOutput: this.#debug ? this.#ctx.createAnalyser() : null,
        output: this.#ctx.createMediaStreamDestination(),
    }

    /* ============================================================================================================== */
    // MARK: Constructor

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

        // ! Set sync options
        this.#set_debug(debug)
        this.#set_gain(gain)
        this.#set_playback(playback)

        // ! Set async options
        this.#noiseSuppression = noiseSuppression
        this.#volumeGate = volumeGate
        // NOTE: as these are async, they have to be called behind a lock
        LOCK(async () => {
            // NOTE: Set+Load volume gate before noise suppression, because it is more important
            await this.#set_volumeGate(volumeGate)
            await this.#set_noiseSuppression(noiseSuppression)
        })
    }

    /**
     * Destroy the pipeline.
     *
     * After calling this method, the instance should not be used anymore.
     */
    async destroy() {
        this.#reset()
        await this.#ctx.close()
    }

    /** Called when no input track is set and state should reset to default. */
    #reset() {
        if (this.#interval !== null) {
            clearInterval(this.#interval)
            this.#interval = null
        }
        // Reset volume to `MIN_VOLUME`, otherwise this freezes the volume meter at the last value
        this.#volumeVoice = MIN_VOLUME
        this.#volume = MIN_VOLUME
        this.#debugVolumeSource = this.#debug ? MIN_VOLUME : null
        this.#debugVolumeOutput = this.#debug ? MIN_VOLUME : null
    }

    /* ============================================================================================================== */
    // MARK: load_*()

    /**
     * Loads the noise suppression audio worklet.
     *
     * - On successful load `#noiseSuppressionLoaded` is set to `true`.
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

    /**
     * Loads the volume meter gate audio worklet.
     *
     * - On successful load `#volumeMeterGateLoaded` is set to `true`.
     * - If the worklet is already loaded, this function does nothing.
     */
    async #load_volume_meter_gate(): Promise<void> {
        DEBUG("Load VolumeMeterGateWorklet")

        if (this.#volumeMeterGateLoaded === true) {
            DEBUG("VolumeMeterGateWorklet already loaded")
            return
        }

        try {
            const timeBefore = Date.now()
            DEBUG("audioContext.audioWorklet.addModule()", VolumeMeterGateWorklet)
            await this.#ctx.audioWorklet.addModule(VolumeMeterGateWorklet)
            this.#volumeMeterGateLoaded = true
            DEBUG(`VolumeMeterGateWorklet loaded successfully after ${Date.now() - timeBefore}ms`)
        } catch (error) {
            WARN("VolumeMeterGateWorklet load error:", error)
            this.#volumeMeterGateLoaded = false
        }
    }

    /* ============================================================================================================== */
    // MARK: #set_*()

    #set_source(track: MediaStreamTrack | null) {
        DEBUG("#set_source()")
        this.#nodes.source?.disconnect()
        this.#nodes.source = track ? this.#ctx.createMediaStreamSource(new MediaStream([track])) : null

        this.#reconnect()
    }

    #set_debug(_debug: boolean) {
        DEBUG("#set_debug()", _debug)
        this.#debug = _debug

        this.#debugVolumeSource = this.#debug ? MIN_VOLUME : null
        this.#debugVolumeOutput = this.#debug ? MIN_VOLUME : null

        this.#nodes.debugVolumeSource?.disconnect()
        this.#nodes.debugVolumeSource = this.#debug ? this.#ctx.createAnalyser() : null
        this.#nodes.debugVolumeOutput?.disconnect()
        this.#nodes.debugVolumeOutput = this.#debug ? this.#ctx.createAnalyser() : null

        this.#reconnect()
    }

    async #set_noiseSuppression(_noiseSuppression: boolean) {
        DEBUG("#set_noiseSuppression()", _noiseSuppression)
        this.#noiseSuppression = _noiseSuppression

        if (this.#noiseSuppression) {
            // load if unloaded
            if (this.#noiseSuppressionLoaded !== true) {
                await this.#load_noise_suppression()
            }
            // if load was successful, instantiate node
            if (this.#noiseSuppressionLoaded === true && !this.#nodes.noiseSupression) {
                this.#nodes.noiseSupression = new AudioWorkletNode(this.#ctx, NoiseSuppressorWorklet_Name)
            }
        }

        this.#reconnect()
    }

    async #set_volumeGate(_volumeGate: number | null) {
        DEBUG("#set_volumeGate()", _volumeGate)
        this.#volumeGate = _volumeGate

        // load if unloaded
        if (this.volumeMeterGateLoaded !== true) {
            await this.#load_volume_meter_gate()
        }
        // if load was successful, instantiate node
        if (this.#volumeMeterGateLoaded === true && !this.#nodes.volumeMeterGate) {
            this.#nodes.volumeMeterGate = new AudioWorkletNode(this.#ctx, VolumeMeterGateWorklet_Name)
            // listen for messages from the worklet
            this.#nodes.volumeMeterGate.port.onmessage = ({ data }: { data: VolumeMeterGateMessage }) => {
                // DEBUG(Date.now(), "data received from VolumeMeterGateWorklet", data)
                this.#volumeVoice = data.volumeInput
                this.#volume = scaleVolume(data.volumeOutput, this.#gain)
                this.#volumeGateOpen = data.factor >= 0.75
                this.#debugGateFactor = data.factor
            }
        }

        if (this.#nodes.volumeMeterGate) {
            this.#nodes.volumeMeterGate.parameters.get(GATE_THRESHOLD_PARAM)!.value = this.#volumeGate ?? MIN_VOLUME
        }

        this.#reconnect()
    }

    #set_gain(_gain: number) {
        DEBUG("#set_gain()", _gain)
        this.#gain = _gain

        this.#nodes.gain.gain.value = this.#gain
    }

    #set_playback(_playback: boolean) {
        DEBUG("#set_playback()", _playback)
        if (_playback !== this.#playback) {
            this.#playback = _playback

            if (this.#playback) {
                this.#nodes.gain.connect(this.#ctx.destination)
            } else {
                this.#nodes.gain.disconnect(this.#ctx.destination)
            }
        }
    }

    /* ============================================================================================================== */
    // MARK: reconnect()

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

        // ! Config
        {
            if (Nodes.debugVolumeSource) Nodes.debugVolumeSource.fftSize = 2048
            Nodes.gain.gain.value = this.#gain
        }

        // ! Disconnect all
        {
            Nodes.source?.disconnect()
            Nodes.mergeChannels.disconnect()
            Nodes.debugVolumeSource?.disconnect()

            Nodes.noiseSupression?.disconnect()
            Nodes.volumeMeterGate?.disconnect()

            Nodes.gain.disconnect()
            Nodes.debugVolumeOutput?.disconnect()
            Nodes.output.disconnect()
        }

        // ! If not input has been set, no need to do anything
        if (!Nodes.source) {
            this.#reset()
            return
        }

        // MARK: > connections
        // ! Connect all nodes
        {
            let node: AudioNode = Nodes.source
            node = node.connect(Nodes.mergeChannels)
            if (Nodes.debugVolumeSource) {
                // DEBUG("connect volumeSource")
                node.connect(Nodes.debugVolumeSource)
            }

            // NOTE: this `if` is different, because we keep the `rnnoise` node when `noiseSuppression` gets disabled
            if (this.#noiseSuppression && Nodes.noiseSupression) {
                // DEBUG("connect noiseSupression")
                node = node.connect(Nodes.noiseSupression)
            }
            if (Nodes.volumeMeterGate) {
                // DEBUG("connect volumeMeterGate")
                node = node.connect(Nodes.volumeMeterGate)
            }

            node = node.connect(Nodes.gain)
            if (Nodes.debugVolumeOutput) {
                // DEBUG("connect volumeOutput")
                node.connect(Nodes.debugVolumeOutput)
            }
            if (this.#playback) node.connect(this.#ctx.destination)
            // this is the last connection
            node.connect(Nodes.output)
        }

        // MARK: > debug volume
        // ! Detect Volume
        if (this.#debug) {
            const sourceData = Nodes.debugVolumeSource ? new Float32Array(Nodes.debugVolumeSource.fftSize) : null
            const outputData = Nodes.debugVolumeOutput ? new Float32Array(Nodes.debugVolumeOutput.fftSize) : null

            const update = () => {
                // NOTE: calculated, because we run this every 7ms, and the worklet runs at 375Hz (48kHz/128frames)
                // NOTE: (48000/128) / (1000/7) = 2.625
                const smoothingFactor = SMOOTHING_FACTOR * 2.625

                if (sourceData) {
                    Nodes.debugVolumeSource?.getFloatTimeDomainData(sourceData)
                    const volume = calculateVolume(sourceData)
                    this.#debugVolumeSource =
                        smoothingFactor * volume + (1 - smoothingFactor) * (this.#debugVolumeSource ?? MIN_VOLUME)
                } else if (this.#debugVolumeSource !== null) {
                    this.#debugVolumeSource = null
                }

                if (outputData) {
                    Nodes.debugVolumeOutput?.getFloatTimeDomainData(outputData)
                    const volume = calculateVolume(outputData)
                    this.#debugVolumeOutput =
                        smoothingFactor * volume + (1 - smoothingFactor) * (this.#debugVolumeOutput ?? MIN_VOLUME)
                } else if (this.#debugVolumeOutput !== null) {
                    this.#debugVolumeOutput = null
                }
            }

            // (Re-)Start Loop
            if (this.#interval !== null) clearInterval(this.#interval)
            this.#interval = setInterval(update, 7)
        }
    }

    /* ============================================================================================================== */
    // MARK: === Exports ===

    /**
     * Set the source track for the pipeline.
     *
     * This is usually the direct input from the microphone, or the received audio track from a voice call.
     */
    async setInput(track: MediaStreamTrack | null) {
        await LOCK(async () => {
            // NOTE: In Chrome, an AudioContext is not allowed to start before a user interaction,
            // NOTE: therefore it is sensible to try to resume it every time a new track is set, just to make sure
            await this.#ctx.resume()

            DEBUG("setTrack", track)
            this.#set_source(track)
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

    /** The volume of the voice signal (after `noiseSuppression`). */
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

    /* ===================================== Modules Loaded ===================================== */

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
    /**
     * If the volume meter gate worket has been added successfully (`audioContext.audioWorklet.addModule(VolumeMeterGateWorklet)`).
     *
     * - `true`: success
     * - `false`: error
     * - `null`: not loaded yet
     */
    get volumeMeterGateLoaded() {
        return this.#volumeMeterGateLoaded
    }

    /* ========================================== Debug ========================================= */

    /** The volume of the input (only measured when `debug = true`). */
    get debugVolumeSource() {
        return this.#debugVolumeSource
    }
    /** The volume of the output (only measured when `debug = true`). */
    get debugVolumeOutput() {
        return this.#debugVolumeOutput
    }

    /** The factor of the volume gate. */
    get debugGateFactor() {
        return this.#debugGateFactor
    }
}
