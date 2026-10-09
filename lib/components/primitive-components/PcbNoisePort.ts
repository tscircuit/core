import { pcbNoisePortProps } from "@tscircuit/props"
import { PcbNoiseDeclaration } from "./PcbNoiseDeclaration"

export class PcbNoisePort extends PcbNoiseDeclaration<
  typeof pcbNoisePortProps
> {
  get config() {
    return { componentName: "PcbNoisePort", zodProps: pcbNoisePortProps }
  }
}
