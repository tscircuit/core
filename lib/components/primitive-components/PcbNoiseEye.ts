import { pcbNoiseEyeProps } from "@tscircuit/props"
import { PcbNoiseDeclaration } from "./PcbNoiseDeclaration"

export class PcbNoiseEye extends PcbNoiseDeclaration<typeof pcbNoiseEyeProps> {
  get config() {
    return { componentName: "PcbNoiseEye", zodProps: pcbNoiseEyeProps }
  }
}
