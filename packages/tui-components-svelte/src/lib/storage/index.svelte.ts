/**
 * @file Exports the `Field<V>` class to load and store values in localStorage.
 */

import { browser } from "$app/environment"
import { BehaviorSubject } from "rxjs"

/* ============================================================================================== */
/*                                              Field                                             */
/* ============================================================================================== */

export type Key = string

export type Options<V> = {
    /** Serialize a value to a string representation. */
    serialize?: (val: V) => string
    /** Whether to set the stored value to null if the default value is set. */
    setNullOnDefault?: boolean
}

/**
 * A class to load and store values in localStorage.
 *
 * @template V The type of the value to store.
 *
 * @example
 * const username = new Field("username", "Steve", Field.load_string, true)
 * username.value // "Steve"
 * username.value = "John" // automatically saved to localStorage
 * username.value // "John"
 * username.value = "Steve" // deleted from localStorage, because it's the default value
 * username.value // "Steve"
 *
 * const debug = new Field("debug", false, Field.load_boolean)
 */
export class Field<V> {
    private _value: V
    /** Used as the source of the exported `Observable` that allows consumers to subscribe to change. */
    private _value$: BehaviorSubject<V>

    private _default_serialized: string

    private serialize: (val: V) => string
    private setNullOnDefault: boolean

    /* ========================================================================================== */

    DEBUG(...msgs: unknown[]) {
        console.debug(`[storage] "${this.key}"`, ...msgs)
    }
    WARN(...msgs: unknown[]) {
        console.warn(`[storage] "${this.key}"`, ...msgs)
    }

    /* ========================================================================================== */

    constructor(
        /** The key under which the value is stored. */
        readonly key: Key,
        /** The fallback value to use if no value is stored or parsing fails. */
        _default: V,

        /** A function to parse a the value's serialized representation into its value type. */
        parse: (str: string) => V | null,
        options?: Options<V>,
    ) {
        this.serialize = options?.serialize ?? JSON.stringify
        this.setNullOnDefault = options?.setNullOnDefault ?? true

        this._default_serialized = this.serialize(_default)

        /** Return the default wrapped with `$state(...)` and console log. */
        const _initDefault = () => {
            const value = $state(_default)
            this.DEBUG("Initialized with default:", _default)
            return value
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
                    const value = $state(storedValue)
                    this.DEBUG("Initialized with loaded:", value)
                    this._value = value
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
                (this.serialize(value) === this._default_serialized && this.setNullOnDefault)
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
        this._value = value
        this._value$.next(value)

        this._save(value)
    }
    get value$() {
        return this._value$.asObservable()
    }

    /* ========================================================================================== */
    /*                                       Load Functions                                       */
    /* ========================================================================================== */

    static readonly parse_string = (str: string): string | null => {
        const value = JSON.parse(str)
        if (typeof value === "string") {
            return value
        } else {
            return null
        }
    }

    static readonly parse_float = (str: string): number | null => {
        const float = parseFloat(str)
        if (isNaN(float)) {
            return null
        } else {
            return float
        }
    }

    static readonly parse_int = (str: string): number | null => {
        const int = parseInt(str)
        if (isNaN(int)) {
            return null
        } else {
            return int
        }
    }

    static readonly parse_boolean = (str: string): boolean | null => {
        const value = JSON.parse(str)
        if (typeof value === "boolean") {
            return value
        } else {
            return null
        }
    }

    /* =========================================== Map ========================================== */

    static readonly parse_map = (str: string): Map<string, unknown> | null => {
        return new Map(JSON.parse(str))
    }

    static readonly serialize_map = (map: Map<string, unknown>): string => {
        return JSON.stringify([...map])
    }

    /* =========================================== Set ========================================== */

    static readonly parse_set = (str: string): Set<unknown> | null => {
        return new Set(JSON.parse(str))
    }

    static readonly serialize_set = (set: Set<unknown>): string => {
        return JSON.stringify([...set])
    }
}
