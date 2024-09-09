import {
    calculateVolume,
    GATE_CLOSE_TIME,
    GATE_CLOSE_TIME_PARAM,
    GATE_OPEN_TIME,
    GATE_OPEN_TIME_PARAM,
    GATE_RELEASE_TIME,
    GATE_RELEASE_TIME_PARAM,
    GATE_THRESHOLD_PARAM,
    MIN_VOLUME,
    scaleVolume,
    SMOOTHING_FACTOR,
    SMOOTHING_FACTOR_PARAM,
    VolumeMeterGateWorklet_Name,
    type VolumeMeterGateMessage,
} from "."

// /** How often updates about the state are send to the main thread. */
const FPS = 60
const FRAME_INTERVAL = 1 / FPS

/* ============================================================================================== */

/** The data representing the current state of the volume gate. */
type Gate = {
    /** Whether the gate is open or closed. */
    open: boolean
    /** The time that the gate change occured. */
    startTime: number
    /** The gain factor when the gate change occured (start value of transition). */
    startFactor: number
}

/* ============================================================================================== */

/**
 * The worklet that measures the volume of the input and gates the output based on the volume.
 *
 * You can set the volume gate behavior with the following parameters:
 * - `volumeSmoothingFactor`: The smoothing factor for the EMA of the volume.
 * - `gateThreshold`: The volume threshold at which the gate should open/close.
 * - `gateReleaseTime`: Time in seconds for the gate to remain open after the volume drops below the threshold.
 * - `gateOpenTime`: Time in seconds for the gate to fully open.
 * - `gateCloseTime`: Time in seconds for the gate to fully close.
 *
 * The worklet sends updates about the volume and gate state to the main thread.
 */
class VolumeMeterGateWorklet extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            {
                name: SMOOTHING_FACTOR_PARAM,
                defaultValue: SMOOTHING_FACTOR,
                minValue: 0,
                maxValue: 1,
                automationRate: "k-rate", // use the same value for each frame
            },
            {
                name: GATE_THRESHOLD_PARAM,
                defaultValue: MIN_VOLUME,
                minValue: MIN_VOLUME,
                automationRate: "k-rate", // use the same value for each frame
            },
            {
                name: GATE_RELEASE_TIME_PARAM,
                defaultValue: GATE_RELEASE_TIME,
                minValue: 0,
                automationRate: "k-rate", // use the same value for each frame
            },
            {
                name: GATE_OPEN_TIME_PARAM,
                defaultValue: GATE_OPEN_TIME,
                minValue: 0,
                automationRate: "k-rate", // use the same value for each frame
            },
            {
                name: GATE_CLOSE_TIME_PARAM,
                defaultValue: GATE_CLOSE_TIME,
                minValue: 0,
                automationRate: "k-rate", // use the same value for each frame
            },
        ]
    }

    /** When the last update was send to the main thread. */
    private _lastUpdate: number
    /** The current volume of the input. */
    private _volume: number

    /** The time the volume first dropped below the threshold, or `null` when above the the volume is threshold. */
    private _gateShouldClose: number | null
    /** The current gate state. */
    private _gate: Gate

    // NOTE: We are using a buffer and calculate the volume from the buffer (this averages it out a bit when the buffer is full)
    // NOTE: Otherwise, if we calculate the volume every time `process()` is called, we have very jumpy volume values
    private _buffer = new Float32Array(2048)
    private _bufferIdx = 0
    private _bufferFull = false

    /* ========================================================================================== */

    constructor() {
        super()

        this._lastUpdate = currentTime
        this._volume = MIN_VOLUME

        this._gateShouldClose = null
        this._gate = {
            open: false,
            startTime: currentTime,
            startFactor: 0,
        }
    }

    /* ========================================================================================== */

    // NOTE: process() is called `sampleRate/length` times per seconds (e.g. 48000/128 = 375 times per second)
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
        // This example only handles mono channel.
        const inputChannelData = inputs[0][0]

        // Exit out early if there is no input data (input node not connected/disconnected)
        // as rest of worklet will crash otherwise
        if (!inputChannelData) {
            this._lastUpdate = currentTime
            this._volume = MIN_VOLUME

            this._gateShouldClose = null
            this._gate = {
                open: false,
                startTime: currentTime,
                startFactor: 0,
            }

            return true
        }

        /* ================================= Resolve Parameters ================================= */

        const smoothingFactor = parameters[SMOOTHING_FACTOR_PARAM][0]
        const gateThreshold = parameters[GATE_THRESHOLD_PARAM][0]
        const gateReleaseTime = parameters[GATE_RELEASE_TIME_PARAM][0]
        const gateOpenTime = parameters[GATE_OPEN_TIME_PARAM][0]
        const gateCloseTime = parameters[GATE_CLOSE_TIME_PARAM][0]

        /* =================================== Measure Volume =================================== */

        // Go to the start of the buffer when reaching the end
        if (this._bufferIdx + inputChannelData.length > this._buffer.length) {
            this._bufferIdx = 0
            this._bufferFull = true
        }

        // Copy data into buffer and update buffer index
        this._buffer.set(inputChannelData, this._bufferIdx)
        this._bufferIdx += inputChannelData.length

        // Calculcate Volume on the buffer
        this.updateVolume(
            this._buffer.subarray(0, this._bufferFull ? undefined : this._bufferIdx), //
            smoothingFactor,
        )

        /* ===================================== Gate Logic ===================================== */

        if (this._volume >= gateThreshold) {
            this._gateShouldClose = null
            this._gate = {
                open: true,
                startTime: currentTime,
                startFactor: factorOfGate(this._gate, currentTime),
            }
        } else {
            if (this._gateShouldClose === null) {
                this._gateShouldClose = currentTime
            }

            if (currentTime > this._gateShouldClose + gateReleaseTime) {
                this._gateShouldClose = null

                this._gate = {
                    open: false,
                    startTime: currentTime,
                    startFactor: factorOfGate(this._gate, currentTime),
                }
            }
        }

        /* ======================================== Gate ======================================== */

        // Calculate the gate factor
        // NOTE: The factor could be different for each frame, this would be more accurate
        // NOTE: However this simplification is not noticable to the user
        const factor = factorOfGate(this._gate, currentTime)

        const input = inputs[0]
        const output = outputs[0]

        for (let channel = 0; channel < output.length; channel++) {
            output[channel].set(input[channel].map((value) => value * factor))
        }

        /* ============================= Send Updates to Main Thread ============================ */

        if (currentTime - this._lastUpdate > FRAME_INTERVAL) {
            this.port.postMessage({
                volumeInput: this._volume,
                volumeOutput: scaleVolume(this._volume, factor),
                factor,
                //
                parameters: {
                    smoothingFactor,
                    gateThreshold,
                    gateReleaseTime,
                    gateOpenTime,
                    gateCloseTime,
                },
            } satisfies VolumeMeterGateMessage)
            this._lastUpdate = currentTime
        }

        /* ====================================================================================== */

        // Keep the processor alive.
        return true
    }

    /** Calculates the volume of the input channel data. */
    private updateVolume(inputChannelData: Float32Array, smoothingFactor: number) {
        const volume = calculateVolume(inputChannelData)
        this._volume = smoothingFactor * volume + (1 - smoothingFactor) * this._volume
    }
}

/* ============================================================================================== */

function easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3)
}
function easeInCubic(x: number): number {
    return Math.pow(x, 3)
}

/** Calculcates and returns the factor of a given gate at the given time. */
function factorOfGate(gate: Gate, time: number): number {
    /** The time since the gate change occured. */
    const passedTime = time - gate.startTime
    const factor = gate.open
        ? gate.startFactor + easeOutCubic(passedTime / GATE_OPEN_TIME) * (1 - gate.startFactor)
        : gate.startFactor - easeInCubic(passedTime / GATE_CLOSE_TIME) * gate.startFactor
    return Math.max(0, Math.min(1, factor))
}

/* ============================================================================================== */

registerProcessor(VolumeMeterGateWorklet_Name, VolumeMeterGateWorklet)
