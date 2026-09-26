import type {
  PcbComponent,
  SchematicComponent,
  SourcePort,
  SourceSimplePinHeader,
} from "circuit-json"
import { PinHeader } from "lib/components/normal-components/PinHeader"
import type { InflatorContext } from "../InflatorFn"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"
import { inflateFootprintComponent } from "./inflateFootprintComponent"

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
  const sourcePorts = injectionDb.source_port
    .list()
    .filter(
      (sourcePort) =>
        sourcePort.source_component_id === sourcePinHeader.source_component_id,
    ) as SourcePort[]
  const pinLabels = Object.fromEntries(
    sourcePorts.flatMap((sourcePort) => {
      if (sourcePort.pin_number === undefined) return []
      return [[`pin${sourcePort.pin_number}`, sourcePort.name]]
    }),
  )
  const { pcbX, pcbY } = getInflatedPcbPlacement({
    pcbComponent,
    sourceGroupId: sourcePinHeader.source_group_id,
    inflatorContext,
  })

  const pinHeader = new PinHeader({
    name: sourcePinHeader.name,
    displayName: sourcePinHeader.display_name,
    manufacturerPartNumber: sourcePinHeader.manufacturer_part_number,
    supplierPartNumbers: sourcePinHeader.supplier_part_numbers ?? undefined,
    pinCount: sourcePinHeader.pin_count,
    gender: sourcePinHeader.gender,
    pinLabels: Object.keys(pinLabels).length > 0 ? pinLabels : undefined,
    schWidth: schematicComponent?.size?.width,
    schHeight: schematicComponent?.size?.height,
    schPinSpacing: schematicComponent?.pin_spacing,
    schX: schematicComponent?.center?.x,
    schY: schematicComponent?.center?.y,
    layer: pcbComponent?.layer,
    pcbX,
    pcbY,
    pcbRotation: pcbComponent?.rotation,
    doNotPlace: pcbComponent?.do_not_place,
    obstructsWithinBounds: pcbComponent?.obstructs_within_bounds,
  })

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
