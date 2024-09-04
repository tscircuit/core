import { groupProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { compose, identity } from "transformation-matrix"
import { z } from "zod"
import { NormalComponent } from "../base-components/NormalComponent"

export class Group<
  Props extends z.ZodType<any, any, any> = typeof groupProps,
> extends NormalComponent<Props> {
  get config() {
    return {
      zodProps: groupProps as unknown as Props,
    }
  }
}
