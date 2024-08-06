/**
 * @file Exports the `Field<V>` class to load and store values in localStorage.
 */

/* ============================================================================================== */
/*                                              Field                                             */
/* ============================================================================================== */

type Key = string

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

    private _default_serialized: string

    private serialize: (val: V) => string
    private setNullOnDefault: boolean

    constructor(
        /** The key under which the value is stored. */
        readonly key: Key,
        /** The fallback value to use if no value is stored or parsing fails. */
        _default: V,

        /** A function to parse a the value's serialized representation into its value type. */
        parse: (str: string) => V | null,
        options: Options<V>,
    ) {
        this.serialize = options.serialize ?? JSON.stringify
        this.setNullOnDefault = options.setNullOnDefault ?? true

        this._default_serialized = this.serialize(_default)

        // calculate/load initial value
        const str = localStorage.getItem(key)
        try {
            const storedValue = str !== null ? parse(str) : null
            const value = $state(storedValue ?? _default)
            this._value = value
        } catch (error) {
            console.warn("Failed to parse value from localStorage:", key, str, error)
            const value = $state(_default)
            this._value = value
        }
    }

    /* ========================================================================================== */

    get value() {
        return this._value
    }
    set value(value) {
        this._value = value

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

    /* ========================================================================================== */

    static readonly parse_map = (str: string): Map<string, unknown> | null => {
        return new Map(JSON.parse(str))
    }

    static readonly serialize_map = (map: Map<string, unknown>): string => {
        return JSON.stringify([...map])
    }
}
