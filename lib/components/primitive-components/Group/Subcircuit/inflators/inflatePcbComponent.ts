import type { SourceComponentBase, PcbComponent } from "circuit-json"
import type { InflatorContext } from "../InflatorFn"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"

export const inflatePcbComponent = (
  pcbElm: PcbComponent,
  inflatorContext: InflatorContext,
) => {
  const { injectionDb, normalComponent } = inflatorContext
  if (!normalComponent) return

  const components = createComponentsFromCircuitJson(
    {
      componentName: normalComponent.name,
      componentRotation: "0deg",
    },
    injectionDb
      .toArray()
      .filter(
        (elm) =>
          "pcb_component_id" in elm &&
          elm.pcb_component_id === pcbElm.pcb_component_id,
      ),
  )

  normalComponent.addAll(components)
}
