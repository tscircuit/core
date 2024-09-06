import { NormalComponent } from "../base-components/NormalComponent"
import { z } from "zod"

const silkscreenTextProps = z.object({
  text: z.string(),
  x: z.number(),
  y: z.number(),
  size: z.number().optional(),
  rotation: z.number().optional(),
})

export class SilkscreenText extends NormalComponent<typeof silkscreenTextProps> {
  static componentName = "SilkscreenText"

  constructor(props: z.input<typeof silkscreenTextProps>) {
    super(props, silkscreenTextProps)
  }

  doInitialSourceComponentRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    db.source_component.insert({
      type: "silkscreentext",
      name: this.name,
      text: props.text,
      x: props.x,
      y: props.y,
      size: props.size,
      rotation: props.rotation,
    })
  }
}
