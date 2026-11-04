import { systemBlockConnectionProps } from "@tscircuit/props"
import { SystemBlockPrimitive } from "../base-components/SystemBlockPrimitive"

export class SystemBlockConnection extends SystemBlockPrimitive<
  typeof systemBlockConnectionProps
> {
  get config() {
    return {
      componentName: "SystemBlockConnection",
      zodProps: systemBlockConnectionProps,
    }
  }
}
