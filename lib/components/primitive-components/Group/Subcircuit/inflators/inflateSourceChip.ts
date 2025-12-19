import type {
  CadComponent,
  PcbComponent,
  SchematicComponent,
  SourcePort,
  SourceSimpleChip,
} from "circuit-json"
import { Chip } from "lib/components/normal-components/Chip"
import type { InflatorContext } from "../InflatorFn"
import { inflatePcbComponent } from "./inflatePcbComponent"

const mapInternallyConnectedSourcePortIdsToPinLabels = (
  sourcePortIds: string[][] | undefined,
  inflatorContext: InflatorContext,
): string[][] | undefined => {
  if (!sourcePortIds || sourcePortIds.length === 0) return undefined

  const { injectionDb } = inflatorContext

  const mapped = sourcePortIds
    .map((group) =>
      group
        .map((sourcePortId) => {
          const port = injectionDb.source_port.get(
            sourcePortId,
          ) as SourcePort | null

          if (!port) return null
          if (port.pin_number !== undefined && port.pin_number !== null) {
            return `pin${port.pin_number}`
          }

          return port.name
        })
        .filter((value): value is string => value !== null),
    )
    .filter((group) => group.length > 0)

  return mapped.length > 0 ? mapped : undefined
}

export const inflateSourceChip = (
  sourceElm: SourceSimpleChip,
  inflatorContext: InflatorContext,
) => {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  const pcbElm = injectionDb.pcb_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as PcbComponent | null

  const schematicElm = injectionDb.schematic_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as SchematicComponent | null

  const cadElm = injectionDb.cad_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as CadComponent | null

  const internallyConnectedPins =
    mapInternallyConnectedSourcePortIdsToPinLabels(
      sourceElm.internally_connected_source_port_ids,
      inflatorContext,
    )

  const chip = new Chip({
    name: sourceElm.name,
    manufacturerPartNumber: sourceElm.manufacturer_part_number,
    supplierPartNumbers: sourceElm.supplier_part_numbers ?? undefined,
    pinLabels: schematicElm?.port_labels ?? undefined,
    schWidth: schematicElm?.size?.width,
    schHeight: schematicElm?.size?.height,
    schPinSpacing: schematicElm?.pin_spacing,
    schX: schematicElm?.center?.x,
    schY: schematicElm?.center?.y,
    layer: pcbElm?.layer,
    pcbX: pcbElm?.center?.x,
    pcbY: pcbElm?.center?.y,
    pcbRotation: pcbElm?.rotation,
    doNotPlace: pcbElm?.do_not_place,
    obstructsWithinBounds: pcbElm?.obstructs_within_bounds,
    footprint: deriveFootprintFromPcbComponent(pcbElm, injectionDb),
    internallyConnectedPins,
  })

  // const footprint = cadElm?.footprinter_string ?? null
  // if (footprint) {
  //   Object.assign(chip.props as any, { footprint })
  //   Object.assign((chip as any)._parsedProps, { footprint })
  //   if (!cadElm) {
  //     ;(chip as any)._addChildrenFromStringFootprint?.()
  //   }
  // }

  // if (pcbElm) {
  //   inflatePcbComponent(pcbElm, {
  //     ...inflatorContext,
  //     normalComponent: chip,
  //   })
  // }

  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(chip)
  } else {
    subcircuit.add(chip)
  }
}
