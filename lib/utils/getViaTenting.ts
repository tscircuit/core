import type { viaProps } from "@tscircuit/props"
import type { z } from "zod"

export const getViaTenting = (tented: z.output<typeof viaProps>["tented"]) => {
  if (tented === undefined) return {}

  return {
    tented_on_top:
      tented === "top_tented" || tented === "top_and_bottom_tented",
    tented_on_bottom:
      tented === "bottom_tented" || tented === "top_and_bottom_tented",
  }
}
