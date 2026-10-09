import { pcbNoiseObservationProps } from "@tscircuit/props"
import { PcbNoiseDeclaration } from "./PcbNoiseDeclaration"

export class PcbNoiseObservation extends PcbNoiseDeclaration<
  typeof pcbNoiseObservationProps
> {
  get config() {
    return {
      componentName: "PcbNoiseObservation",
      zodProps: pcbNoiseObservationProps,
    }
  }
}
