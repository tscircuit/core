import { type PcbCopperPourProps, pcbCopperPourProps } from "@tscircuit/props"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { PcbCopperPour_doInitialPcbPrimitiveRender } from "./PcbCopperPour_doInitialPcbPrimitiveRender"

export type { PcbCopperPourProps }

/**
 * Inserts precomputed copper geometry expressed in footprint-local millimetres.
 * +X points right and +Y points toward the top of the board. The primitive
 * applies its parent footprint transform before writing board-world geometry.
 */
export class PcbCopperPour extends PrimitiveComponent<
  typeof pcbCopperPourProps
> {
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "PcbCopperPour",
      zodProps: pcbCopperPourProps,
    }
  }

  getPcbSize(): { width: number; height: number } {
    return { width: 0, height: 0 }
  }

  doInitialCreateNetsFromProps(): void {
    createNetsFromProps(
      this,
      this._parsedProps.connectsTo ? [this._parsedProps.connectsTo] : [],
    )
  }

  doInitialPcbPrimitiveRender(): void {
    PcbCopperPour_doInitialPcbPrimitiveRender(this)
  }
}
