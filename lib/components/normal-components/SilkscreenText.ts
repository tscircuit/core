import { z } from "zod"
import { NormalComponent } from "../base-components/NormalComponent"

const silkscreenTextProps = z.object({
  name: z.string().optional(),
  text: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  size: z.number().optional(),
  rotation: z.number().optional(),
})

export class SilkscreenText extends NormalComponent<typeof silkscreenTextProps> {
  static componentName = "SilkscreenText"

  constructor(props: z.input<typeof silkscreenTextProps>) {
    super(props)
  }

  get config() {
    return {
      zodProps: silkscreenTextProps,
    }
  }
}
