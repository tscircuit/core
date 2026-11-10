import { systemBlockComponentProps } from "@tscircuit/props"
import { SystemBlockPrimitive } from "../base-components/SystemBlockPrimitive"

export class SystemBlockComponent extends SystemBlockPrimitive<
  typeof systemBlockComponentProps
> {
  get config() {
    return {
      componentName: "SystemBlockComponent",
      zodProps: systemBlockComponentProps,
    }
  }
}
