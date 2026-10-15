import { pcbPostRoutingStepProps } from "@tscircuit/props"
import type { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/**
 * User code that changes the PCB after its board or subcircuit is routed. The
 * step renders nothing itself: the board or subcircuit collects its steps and
 * runs them in order (see Group_doInitialPcbPostRoutingStepRender).
 */
export class PcbPostRoutingStep extends PrimitiveComponent<
  typeof pcbPostRoutingStepProps
> {
  get config() {
    return {
      componentName: "PcbPostRoutingStep",
      zodProps: pcbPostRoutingStepProps,
    }
  }

  constructor(props: z.input<typeof pcbPostRoutingStepProps>) {
    super(props)
  }
}
