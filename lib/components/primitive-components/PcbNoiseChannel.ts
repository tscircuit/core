import { pcbNoiseChannelProps } from "@tscircuit/props"
import { PcbNoiseDeclaration } from "./PcbNoiseDeclaration"

export class PcbNoiseChannel extends PcbNoiseDeclaration<
  typeof pcbNoiseChannelProps
> {
  get config() {
    return { componentName: "PcbNoiseChannel", zodProps: pcbNoiseChannelProps }
  }
}
