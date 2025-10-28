import type { SourceComponentBase, PcbComponent } from "circuit-json"
import type { InflatorContext } from "../InflatorFn"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"

export const inflatePcbComponent = (
  pcbElm: PcbComponent,
  inflatorContext: InflatorContext,
) => {
  const { injectionDb, normalComponent } = inflatorContext
  if (!normalComponent) return

  // Add all the smtpads etc.
}
