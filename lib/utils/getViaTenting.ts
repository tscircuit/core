import { viaProps } from "@tscircuit/props"
import { z } from "zod"

export const viaTentingProp = z.union([
  viaProps.shape.tented,
  z.enum(["both", "top", "bottom", "none", "none_tented"]),
  z.object({
    top: z.boolean().optional(),
    bottom: z.boolean().optional(),
  }),
])

export type ViaTentingInput =
  | z.input<typeof viaTentingProp>
  | z.output<typeof viaTentingProp>

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
