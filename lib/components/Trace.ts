import { traceProps } from "@tscircuit/props"
import { BaseComponent } from "./BaseComponent"

export class Trace extends BaseComponent<typeof traceProps> {
  get config() {
    return {
      zodProps: traceProps,
    }
  }
}
