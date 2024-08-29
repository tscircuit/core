import { groupProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { compose, identity } from "transformation-matrix"

export class Group extends PrimitiveComponent<typeof groupProps> {
  get config() {
    return {
      zodProps: groupProps,
    }
  }
}
