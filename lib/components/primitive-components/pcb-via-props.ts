import { type ViaProps, viaProps } from "@tscircuit/props"
import { type LayerRef, layer_ref } from "circuit-json"

import { z } from "zod"

export const pcbViaProps = viaProps
  .extend({
    layers: z.array(layer_ref).optional(),
    /** @deprecated Use tentedOnTop and tentedOnBottom instead. */
    isTented: z.boolean().optional(),
    tentedOnTop: z.boolean().optional(),
    tentedOnBottom: z.boolean().optional(),
  })
  .partial({
    fromLayer: true,
    toLayer: true,
  })

export interface PcbViaProps extends Partial<ViaProps> {
  layers?: LayerRef[]
  /** @deprecated Use tentedOnTop and tentedOnBottom instead. */
  isTented?: boolean
  tentedOnTop?: boolean
  tentedOnBottom?: boolean
}
