import { breakoutProps } from "@tscircuit/props"
import { Group } from "../Group/Group"
import type { z } from "zod"
import { Breakout_doInitialPcbBreakoutPointRender } from "./Breakout_doInitialPcbBreakoutPointRender"

export class Breakout extends Group<typeof breakoutProps> {
  constructor(props: z.input<typeof breakoutProps>) {
    super({
      ...props,
      // @ts-ignore
      subcircuit: true,
    })
  }

  doInitialPcbBreakoutPointRender(): void {
    Breakout_doInitialPcbBreakoutPointRender(this)
  }
}
