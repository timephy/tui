export const VolumeMeterGateWorklet_Name = "VolumeMeterGateWorklet"

/* ============================================================================================== */

/** A small value to prevent log(0) error. */
const EPSILON = 1e-10
export const MIN_VOLUME = 20 * Math.log10(EPSILON) // -200 dB

/** Calculate the volume in dB of the input channel data. */
export function calculateVolume(inputChannelData: Float32Array) {
    const sumSquares = inputChannelData.reduce((sum, amplitude) => sum + amplitude * amplitude, 0)
    const instantVolume = Math.sqrt(sumSquares / inputChannelData.length)
    return 20 * Math.log10(instantVolume + EPSILON) // Convert to dB
}

/** Scale a given volume in dB by a factor. */
export function scaleVolume(volume: number, factor: number): number {
    if (volume === MIN_VOLUME) return MIN_VOLUME

    return volume + Math.log2(factor) * 6
}

/* ============================================================================================== */

// NOTE: The smoothing is also influenced by the frequency of the update loop
// Exponential Moving Average (EMA) for smoothing the volume meter
// 1 = no smoothing, 0 = max smoothing (no change ever)
/** The smoothing factor for the EMA of the volume. */
export const SMOOTHING_FACTOR = 0.125 / 2
/** Time in seconds for the gate to remain open after the volume drops below the threshold */
export const GATE_RELEASE_TIME = 0.4
/** Time in seconds for the gate to fully open */
export const GATE_OPEN_TIME = 0.04
/** Time in seconds for the gate to fully close */
export const GATE_CLOSE_TIME = 0.2

/* ============================================================================================== */

export const SMOOTHING_FACTOR_PARAM = "volumeSmoothingFactor"
export const GATE_THRESHOLD_PARAM = "gateThreshold"
export const GATE_RELEASE_TIME_PARAM = "gateReleaseTime"
export const GATE_OPEN_TIME_PARAM = "gateOpenTime"
export const GATE_CLOSE_TIME_PARAM = "gateCloseTime"

/* ============================================================================================== */

/** The message type that is send by the worklet to the main thread. */
export type VolumeMeterGateMessage = Record<string, unknown> & {
    /** The volume measured from the input to the worklet. */
    volumeInput: number
    /** The volume calculated to be the output of the worklet (after volume gate). */
    volumeOutput: number
    /** The factor that is used to volume gate the output (output = input * factor). */
    factor: number
}
