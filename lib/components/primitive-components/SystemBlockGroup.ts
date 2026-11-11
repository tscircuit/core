import { systemBlockGroupProps } from "@tscircuit/props"
import { SystemBlockPrimitive } from "../base-components/SystemBlockPrimitive"

export class SystemBlockGroup extends SystemBlockPrimitive<
  typeof systemBlockGroupProps
> {
  get config() {
    return {
      componentName: "SystemBlockGroup",
      zodProps: systemBlockGroupProps,
    }
  }
}
