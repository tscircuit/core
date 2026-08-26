import { copperPourProps, type CopperPourProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import { CopperPour_doInitialPcbCopperPourRender } from "./CopperPour_doInitialPcbCopperPourRender"

export type { CopperPourProps }

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
}
