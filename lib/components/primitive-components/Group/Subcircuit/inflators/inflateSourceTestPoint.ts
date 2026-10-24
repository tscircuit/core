import type {
  CadComponent,
  PcbComponent,
  SourceSimpleTestPoint,
} from "circuit-json"
import { TestPoint } from "lib/components/normal-components/TestPoint"
import type { InflatorContext } from "../InflatorFn"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"
import { inflateFootprintComponent } from "./inflateFootprintComponent"

class InflatedTestPoint extends TestPoint {
  override _getImpliedFootprintString(): string | null {
    return null
  }
}

export function inflateSourceTestPoint(
  sourceElm: SourceSimpleTestPoint,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  const pcbElm = injectionDb.pcb_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as PcbComponent | null

  const { pcbX, pcbY } = getInflatedPcbPlacement({
    pcbComponent: pcbElm,
    sourceGroupId: sourceElm.source_group_id,
    inflatorContext,
  })

  const testPoint = new InflatedTestPoint({
    name: sourceElm.name,
    displayName: sourceElm.display_name,
    footprintVariant: sourceElm.footprint_variant,
    padShape: sourceElm.pad_shape,
    padDiameter: sourceElm.pad_diameter,
    holeDiameter: sourceElm.hole_diameter,
    width: sourceElm.width,
    height: sourceElm.height,
    supplierPartNumbers: sourceElm.supplier_part_numbers,
    manufacturerPartNumber: sourceElm.manufacturer_part_number,
    layer: pcbElm?.layer,
    pcbX,
    pcbY,
    pcbRotation: pcbElm?.rotation,
    doNotPlace: pcbElm?.do_not_place,
    obstructsWithinBounds: pcbElm?.obstructs_within_bounds,
  })

  if (pcbElm) {
    const footprint = inflateFootprintComponent(pcbElm, {
      ...inflatorContext,
      normalComponent: testPoint,
    })

    if (footprint) {
      testPoint.add(footprint)
    }
  }

  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(testPoint)
  } else {
    subcircuit.add(testPoint)
  }
}
