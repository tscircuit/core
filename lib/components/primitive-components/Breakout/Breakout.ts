import { breakoutProps } from "@tscircuit/props"
import { Group } from "../Group/Group"
import type { z } from "zod"

export class Breakout extends Group<typeof breakoutProps> {
  constructor(props: z.input<typeof breakoutProps>) {
    super({
      ...props,
      // @ts-ignore
      subcircuit: true,
    })
  }

  doInitialPcbPrimitiveRender(): void {
    super.doInitialPcbPrimitiveRender()
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const props = this._parsedProps as z.infer<typeof breakoutProps>
    if (!this.pcb_group_id) return
    const pcb_group = db.pcb_group.get(this.pcb_group_id)!
    const padLeft = props.paddingLeft ?? props.padding ?? 0
    const padRight = props.paddingRight ?? props.padding ?? 0
    const padTop = props.paddingTop ?? props.padding ?? 0
    const padBottom = props.paddingBottom ?? props.padding ?? 0
    db.pcb_group.update(this.pcb_group_id, {
      width: pcb_group.width ?? 0 + padLeft + padRight,
      height: pcb_group.height ?? 0 + padTop + padBottom,
      center: {
        x: pcb_group.center.x + (padRight - padLeft) / 2,
        y: pcb_group.center.y + (padTop - padBottom) / 2,
      },
    })
  }
}
