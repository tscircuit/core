import type { PCBKeepout } from "circuit-json"

/** Keepout metadata pending inclusion in circuit-json's published types. */
export type PcbKeepoutWithWarningOnly = PCBKeepout & {
  warning_only?: boolean
}
