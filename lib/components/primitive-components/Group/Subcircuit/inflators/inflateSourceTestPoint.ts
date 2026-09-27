import type { TestpointProps } from "@tscircuit/props"
import type {
  PcbComponent,
  SchematicComponent,
  SourceSimpleTestPoint,
} from "circuit-json"
import { TestPoint } from "lib/components/normal-components/TestPoint"
import type { InflatorContext } from "../InflatorFn"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"
import { inflateFootprintComponent } from "./inflateFootprintComponent"

class InflatedTestPoint extends TestPoint {
  _getImpliedFootprintString(): string | null {
    return null
  }
}

export function inflateSourceTestPoint(
  sourceTestPoint: SourceSimpleTestPoint,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext
  const pcbComponent = injectionDb.pcb_component.getWhere({
    source_component_id: sourceTestPoint.source_component_id,
  }) as PcbComponent | null
  const schematicComponent = injectionDb.schematic_component.getWhere({
    source_component_id: sourceTestPoint.source_component_id,
  }) as SchematicComponent | null
  const { pcbX, pcbY } = getInflatedPcbPlacement({
    pcbComponent,
    sourceGroupId: sourceTestPoint.source_group_id,
    inflatorContext,
  })
  const testPointProps: TestpointProps = {
    name: sourceTestPoint.name,
    displayName: sourceTestPoint.display_name,
    manufacturerPartNumber: sourceTestPoint.manufacturer_part_number,
    supplierPartNumbers: sourceTestPoint.supplier_part_numbers ?? undefined,
    footprintVariant: sourceTestPoint.footprint_variant,
    padShape: sourceTestPoint.pad_shape,
    padDiameter: sourceTestPoint.pad_diameter,
    holeDiameter: sourceTestPoint.hole_diameter,
    width: sourceTestPoint.width,
    height: sourceTestPoint.height,
    symbolName: schematicComponent?.symbol_name,
    schX: schematicComponent?.center.x,
    schY: schematicComponent?.center.y,
    layer: pcbComponent?.layer,
    pcbX,
    pcbY,
    pcbRotation: pcbComponent?.rotation,
    doNotPlace: pcbComponent?.do_not_place,
    obstructsWithinBounds: pcbComponent?.obstructs_within_bounds,
  }
  const testPoint = new InflatedTestPoint(testPointProps)

  if (pcbComponent) {
    const footprint = inflateFootprintComponent(pcbComponent, {
      ...inflatorContext,
      normalComponent: testPoint,
    })
    if (footprint) testPoint.add(footprint)
  }

  if (
    sourceTestPoint.source_group_id &&
    groupsMap?.has(sourceTestPoint.source_group_id)
  ) {
    groupsMap.get(sourceTestPoint.source_group_id)!.add(testPoint)
  } else {
    subcircuit.add(testPoint)
  }
}
