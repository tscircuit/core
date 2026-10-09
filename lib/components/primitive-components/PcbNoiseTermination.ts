import { pcbNoiseTerminationProps } from "@tscircuit/props"
import { PcbNoiseDeclaration } from "./PcbNoiseDeclaration"

export class PcbNoiseTermination extends PcbNoiseDeclaration<
  typeof pcbNoiseTerminationProps
> {
  get config() {
    return {
      componentName: "PcbNoiseTermination",
      zodProps: pcbNoiseTerminationProps,
    }
  }
}
