import type { viaProps } from "@tscircuit/props"
import type { z } from "zod"

export type ViaTentingInput =
  | z.input<typeof viaProps>["tented"]
  | z.output<typeof viaProps>["tented"]
  | "both"
  | "top"
  | "bottom"
  | "none"
  | "none_tented"
  | {
      top?: boolean
      bottom?: boolean
    }

export const getViaTenting = (tented: ViaTentingInput) => {
  if (tented === undefined) return {}

  if (typeof tented === "boolean") {
    return {
      tented_on_top: tented,
      tented_on_bottom: tented,
    }
  }

  if (typeof tented === "object" && tented !== null) {
    return {
      ...(tented.top !== undefined ? { tented_on_top: tented.top } : {}),
      ...(tented.bottom !== undefined
        ? { tented_on_bottom: tented.bottom }
        : {}),
    }
  }

  return {
    tented_on_top:
      tented === "top_tented" ||
      tented === "top_and_bottom_tented" ||
      tented === "top" ||
      tented === "both",
    tented_on_bottom:
      tented === "bottom_tented" ||
      tented === "top_and_bottom_tented" ||
      tented === "bottom" ||
      tented === "both",
  }
}
