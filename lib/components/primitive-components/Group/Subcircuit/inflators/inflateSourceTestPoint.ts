import type {
  CadComponent,
  PcbComponent,
  SourceSimpleTestPoint,
} from "circuit-json"
import { TestPoint } from "lib/components/normal-components/TestPoint"
import type { InflatorContext } from "../InflatorFn"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"
import { inflateFootprintComponent } from "./inflateFootprintComponent"

export function inflateSourceTestPoint(
  sourceElm: SourceSimpleTestPoint,
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

  const testPoint = new TestPoint({
    name: sourceElm.name,
    layer: pcbElm?.layer,
    pcbX,
    pcbY,
    pcbRotation: pcbElm?.rotation,
    doNotPlace: pcbElm?.do_not_place,
    obstructsWithinBounds: pcbElm?.obstructs_within_bounds,
    footprintVariant: sourceElm.footprint_variant,
    padShape: sourceElm.pad_shape,
    padDiameter: sourceElm.pad_diameter,
    holeDiameter: sourceElm.hole_diameter,
    width: sourceElm.width,
    height: sourceElm.height,
  })

  // Create a Footprint component from the PCB primitives in the circuit JSON
  if (pcbElm) {
    const footprint = inflateFootprintComponent(pcbElm, {
      ...inflatorContext,
      normalComponent: testPoint,
    })

    if (footprint) {
      testPoint.add(footprint)
    }
  }

  // Add the testPoint to the appropriate group or subcircuit
  const group = groupsMap.get(sourceElm.source_group_id ?? "")
  if (group) {
    group.add(testPoint)
  } else {
    subcircuit.add(testPoint)
  }
}
