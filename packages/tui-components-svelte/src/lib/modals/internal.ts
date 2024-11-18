import type { Component } from "svelte"

export const MODAL_CONTROLLER_KEY = "timui.ModalController"
export const MODAL_KEY = "timui.Modal"

export type ComponentWithProps<Props extends Record<string, unknown>> = {
    component: Component<Props>
    props: Props
}
