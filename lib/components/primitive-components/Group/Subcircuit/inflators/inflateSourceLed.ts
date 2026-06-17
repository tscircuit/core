import type { CadComponent, PcbComponent, SourceSimpleLed } from "circuit-json"
import { Led } from "lib/components/normal-components/Led"
import type { InflatorContext } from "../InflatorFn"
import { inflateFootprintComponent } from "./inflateFootprintComponent"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"

export function inflateSourceLed(
  sourceElm: SourceSimpleLed,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  const pcbElm = injectionDb.pcb_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as PcbComponent | null

  const cadElm = injectionDb.cad_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as CadComponent | null

  const { pcbX, pcbY } = getInflatedPcbPlacement({
    pcbComponent: pcbElm,
    sourceGroupId: sourceElm.source_group_id,
    inflatorContext,
  })

  const led = new Led({
    name: sourceElm.name,
    color: sourceElm.color,
    wavelength: sourceElm.wavelength ?? (sourceElm as any).wave_length,
    layer: pcbElm?.layer,
    pcbX,
    pcbY,
    pcbRotation: pcbElm?.rotation,
    doNotPlace: pcbElm?.do_not_place,
    obstructsWithinBounds: pcbElm?.obstructs_within_bounds,
  })

  // Create a Footprint component from the PCB primitives in the circuit JSON
  if (pcbElm) {
    const footprint = inflateFootprintComponent(pcbElm, {
      ...inflatorContext,
      normalComponent: led,
    })

    if (footprint) {
      led.add(footprint)
    }
  }

  // Add the LED to its group if it has one, otherwise add to subcircuit
  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(led)
  } else {
    subcircuit.add(led)
  }
}
