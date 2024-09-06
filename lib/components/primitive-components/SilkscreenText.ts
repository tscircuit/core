import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { silkscreenTextProps } from "@tscircuit/props"

export class SilkscreenText extends PrimitiveComponent<typeof silkscreenTextProps> {
  doInitialPcbPrimitiveRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    db.pcb_silkscreentext.insert({
      ...props,
      component_id: this.id,
    })
  }
}
