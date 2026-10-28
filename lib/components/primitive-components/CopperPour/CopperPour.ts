import { copperPourProps } from "@tscircuit/props"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import { CopperPour_doInitialPcbCopperPourRender } from "./CopperPour_doInitialPcbCopperPourRender"
import { CopperPour_doInitialPcbViaStitchRender } from "./CopperPour_doInitialPcbViaStitchRender"

export class CopperPour extends PrimitiveComponent<typeof copperPourProps> {
  isPcbPrimitive = true
  _isImplicitCopperPour = false

  get config() {
    return {
      componentName: "CopperPour",
      zodProps: copperPourProps,
    }
  }

  getPcbSize(): { width: number; height: number } {
    return { width: 0, height: 0 }
  }

  doInitialCreateNetsFromProps(): void {
    const { _parsedProps: props } = this
    createNetsFromProps(this, [props.connectsTo])
  }

  doInitialPcbCopperPourRender(): void {
    CopperPour_doInitialPcbCopperPourRender(this)
  }

  doInitialPcbViaStitchRender(): void {
    CopperPour_doInitialPcbViaStitchRender(this)
  }
}
