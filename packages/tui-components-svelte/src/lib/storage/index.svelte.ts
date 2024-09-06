/**
 * @file Exports the `Stored<V>` class to load and store values in localStorage.
 */

import { browser } from "$app/environment"
import { BehaviorSubject } from "rxjs"
import { SvelteMap, SvelteSet } from "svelte/reactivity"

/* ============================================================================================== */
/*                                             Stored                                             */
/* ============================================================================================== */

export type Key = string

type ValuePrimitive = null | number | string | boolean
type Value = ValuePrimitive | SvelteMap<unknown, unknown> | SvelteSet<unknown>

export type Options = {
    /** Whether to set the stored value to null if the default value is set. */
    setNullOnDefault: boolean
}

/**
 * A class to load and store values in localStorage.
 *
 * @template V The type of the value to store.
 *
 * @example
 * const username = new Storage("username", "Steve")
 * username.value // "Steve"
 * username.value = "John" // automatically saved to localStorage
 * username.value // "John"
 * username.value = "Steve" // deleted from localStorage, because it's the default value
 * username.value // "Steve"
 *
 * const debug = new Storage("debug", false)
 */
export default class Storage<V extends Value> {
    private _value: V = $state()! // TODO: required to declare $state, but not able to init until constructor
    /** Used as the source of the exported `Observable` that allows consumers to subscribe to change. */
    private _value$: BehaviorSubject<V>

    private _default_serialized: string
    private _options: Options

    /* ========================================================================================== */

    DEBUG(...msgs: unknown[]) {
        console.debug(`[Storage] "${this.key}"`, ...msgs)
    }
    WARN(...msgs: unknown[]) {
        console.warn(`[Storage] "${this.key}"`, ...msgs)
    }

    /* ========================================================================================== */

    constructor(
        /** The key under which the value is stored. */
        readonly key: Key,
        /** The fallback value to use if no value is stored or parsing fails. */
        _default: V,

        /** A function to parse a the value's serialized representation into its value type. */
        parse: (str: string) => V | null,
        private serialize: (val: V) => string,

        options?: Partial<Options>,
    ) {
        this._default_serialized = this.serialize(_default)
        this._options = { setNullOnDefault: true, ...options }

        /** Return the default and console log. */
        const _initDefault = () => {
            this.DEBUG("Initialized with default:", _default)
            return _default
        }

        // NOTE: Cannot access localStorage on the server
        if (!browser) {
            this._value = _initDefault()
            this._value$ = new BehaviorSubject(this._value)
            return
        }

        // calculate/load initial value
        const str = localStorage.getItem(key)
        if (str !== null) {
            try {
                const storedValue = parse(str)
                if (storedValue !== null) {
                    // successfully parsed stored value
                    this.DEBUG("Initialized with loaded:", storedValue)
                    this._value = storedValue
                } else {
                    // parse returned null
                    this.WARN("parsing aborted:", key, str)
                    this._value = _initDefault()
                }
            } catch (error) {
                // parsing threw an error
                this.WARN("parse threw an error:", key, str, error)
                this._value = _initDefault()
            }
        } else {
            // no value stored
            this._value = _initDefault()
        }

        this._value$ = new BehaviorSubject(this._value)
    }

    private _save(value: V) {
        if (localStorage) {
            if (
                value === null ||
                (this.serialize(value) === this._default_serialized &&
                    this._options.setNullOnDefault)
            ) {
                localStorage.removeItem(this.key)
            } else {
                localStorage.setItem(this.key, this.serialize(value))
            }
        }
    }

    /* ========================================================================================== */

    get value() {
        return this._value
    }
    set value(value) {
        this.DEBUG("=", value)
        this._value = value
        this._value$.next(value)

        this._save(value)
    }
    get value$() {
        return this._value$.asObservable()
    }

    /* ========================================================================================== */

    // NOTE: `D extends V | null` to allow null as the default value, then the returned type will be `Storage<V | null>`, but only if null was set as the default value

    // NOTE: These weird generics allow use of literal string types as V
    static string = <V extends string | null = string, D extends string | null = V>(
        key: Key,
        _default: D,
        options?: Partial<Options>,
    ) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new Storage<V | D>(key, _default, parse_string as any, JSON.stringify, options)
    }

    static boolean = <D extends boolean | null>(
        key: Key,
        _default: D,
        options?: Partial<Options>,
    ) => {
        return new Storage<boolean | D>(key, _default, parse_boolean, JSON.stringify, options)
    }

    static float = <D extends number | null>(
        key: Key,
        _default: D,
        options?: Partial<Options>, //
    ) => {
        return new Storage<number | D>(key, _default, parse_float, JSON.stringify, options)
    }

    static int = <D extends number | null>(
        key: Key,
        _default: D,
        options?: Partial<Options>, //
    ) => {
        return new Storage<number | D>(key, _default, parse_int, JSON.stringify, options)
    }

    static Set = <V extends ValuePrimitive>(
        key: Key,
        _default: SvelteSet<V>,
        options?: Partial<Options>, //
    ) => {
        return new Storage<SvelteSet<V>>(key, _default, parse_set, serialize_set, options)
    }

    static Map = <K extends ValuePrimitive, V extends ValuePrimitive>(
        key: Key,
        _default: SvelteMap<K, V>,
        options?: Partial<Options>, //
    ) => {
        return new Storage<SvelteMap<K, V>>(key, _default, parse_map, serialize_map, options)
    }
}

/* ============================================================================================== */
/*                                         Load Functions                                         */
/* ============================================================================================== */

const parse_string = (str: string): string | null => {
    const value = JSON.parse(str)
    if (typeof value === "string") {
        return value
    } else {
        return null
    }
}

const parse_float = (str: string): number | null => {
    const float = parseFloat(str)
    if (isNaN(float)) {
        return null
    } else {
        return float
    }
}

const parse_int = (str: string): number | null => {
    const int = parseInt(str)
    if (isNaN(int)) {
        return null
    } else {
        return int
    }
}

const parse_boolean = (str: string): boolean | null => {
    const value = JSON.parse(str)
    if (typeof value === "boolean") {
        return value
    } else {
        return null
    }
}

/* ============================================= Set ============================================ */

const parse_set = <V>(str: string): SvelteSet<V> | null => {
    return new SvelteSet(JSON.parse(str))
}

const serialize_set = <V>(set: SvelteSet<V>): string => {
    return JSON.stringify([...set])
}

/* ============================================= Map ============================================ */

const parse_map = <K, V>(str: string): SvelteMap<K, V> | null => {
    return new SvelteMap(JSON.parse(str))
}

const serialize_map = <K, V>(map: SvelteMap<K, V>): string => {
    return JSON.stringify([...map])
}

/* ============================================================================================== */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function test() {
    const literalString1 = Storage.string("literalString", null)
    const literalString12 = Storage.string<null>("literalString", null)
    const literalString2 = Storage.string<"A" | "B">("literalString", "B")
    const literalString3 = Storage.string<"A" | "B" | null>("literalString", null)
    literalString1.value
    literalString12.value
    literalString2.value
    literalString3.value
}
