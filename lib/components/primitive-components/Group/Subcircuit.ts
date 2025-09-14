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

export interface SubcircuitGroupProps {
  showAsBox?: boolean // or your chosen prop name
  connections?: { [key: string]: string }
  schPinArrangement?: { [side: string]: { direction: string; pins: string[] } }
  border?: { dashed?: boolean }
  schWidth?: number
  schHeight?: number
  // Include all other needed props and validation schemas
}
