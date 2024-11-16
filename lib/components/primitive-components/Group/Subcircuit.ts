import { Group } from "./Group"
import { subcircuitProps } from "@tscircuit/props"
import type { z } from "zod"

export class Subcircuit extends Group {
  constructor(props: z.input<typeof subcircuitProps>) {
    super({
      ...props,
      subcircuit: true,
    })
  }
}
