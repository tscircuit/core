import type { PinHeaderProps } from "@tscircuit/props"
import type {
  PcbComponent,
  SchematicComponent,
  SourceSimplePinHeader,
} from "circuit-json"
import { PinHeader } from "lib/components/normal-components/PinHeader"
import type { InflatorContext } from "../InflatorFn"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"
import { inflateFootprintComponent } from "./inflateFootprintComponent"

class InflatedPinHeader extends PinHeader {
  _getImpliedFootprintString(): string | null {
    return null
  }
}

const getInflatedPinLabels = (
  sourcePinHeader: SourceSimplePinHeader,
  inflatorContext: InflatorContext,
): PinHeaderProps["pinLabels"] => {
  const pinLabels: Record<string, string> = {}
  const sourcePorts = inflatorContext.injectionDb.source_port
    .list()
    .filter(
      (sourcePort) =>
        sourcePort.source_component_id === sourcePinHeader.source_component_id,
    )

  for (const sourcePort of sourcePorts) {
    if (sourcePort.pin_number === undefined) continue
    if (sourcePort.name.length === 0) continue
    pinLabels[`pin${sourcePort.pin_number}`] = sourcePort.name
  }

  return Object.keys(pinLabels).length > 0 ? pinLabels : undefined
}

export function inflateSourcePinHeader(
  sourcePinHeader: SourceSimplePinHeader,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext
  const pcbComponent = injectionDb.pcb_component.getWhere({
    source_component_id: sourcePinHeader.source_component_id,
  }) as PcbComponent | null
  const schematicComponent = injectionDb.schematic_component.getWhere({
    source_component_id: sourcePinHeader.source_component_id,
  }) as SchematicComponent | null
  const { pcbX, pcbY } = getInflatedPcbPlacement({
    pcbComponent,
    sourceGroupId: sourcePinHeader.source_group_id,
    inflatorContext,
  })
  const pinHeaderProps: PinHeaderProps = {
    name: sourcePinHeader.name,
    displayName: sourcePinHeader.display_name,
    manufacturerPartNumber: sourcePinHeader.manufacturer_part_number,
    supplierPartNumbers: sourcePinHeader.supplier_part_numbers ?? undefined,
    pinCount: sourcePinHeader.pin_count,
    gender: sourcePinHeader.gender,
    pinLabels: getInflatedPinLabels(sourcePinHeader, inflatorContext),
    schWidth: schematicComponent?.size.width,
    schHeight: schematicComponent?.size.height,
    schPinSpacing: schematicComponent?.pin_spacing,
    schX: schematicComponent?.center.x,
    schY: schematicComponent?.center.y,
    layer: pcbComponent?.layer,
    pcbX,
    pcbY,
    pcbRotation: pcbComponent?.rotation,
    doNotPlace: pcbComponent?.do_not_place,
    obstructsWithinBounds: pcbComponent?.obstructs_within_bounds,
  }
  const pinHeader = new InflatedPinHeader(pinHeaderProps)

  if (pcbComponent) {
    const footprint = inflateFootprintComponent(pcbComponent, {
      ...inflatorContext,
      normalComponent: pinHeader,
    })
    if (footprint) pinHeader.add(footprint)
  }

  if (
    sourcePinHeader.source_group_id &&
    groupsMap?.has(sourcePinHeader.source_group_id)
  ) {
    groupsMap.get(sourcePinHeader.source_group_id)!.add(pinHeader)
  } else {
    subcircuit.add(pinHeader)
  }
}
