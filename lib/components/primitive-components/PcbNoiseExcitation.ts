import { pcbNoiseExcitationProps } from "@tscircuit/props"
import { PcbNoiseDeclaration } from "./PcbNoiseDeclaration"

export class PcbNoiseExcitation extends PcbNoiseDeclaration<
  typeof pcbNoiseExcitationProps
> {
  get config() {
    return {
      componentName: "PcbNoiseExcitation",
      zodProps: pcbNoiseExcitationProps,
    }
  }
}
