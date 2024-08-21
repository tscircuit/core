import { groupProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class Group extends PrimitiveComponent<typeof groupProps> {
  get config() {
    return {
      zodProps: groupProps,
    }
  }
}
