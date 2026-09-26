import type {
  CadComponent,
  PcbComponent,
  SchematicComponent,
  SourcePort,
  SourceSimpleChip,
} from "circuit-json"
import { Chip } from "lib/components/normal-components/Chip"
import type { InflatorContext } from "../InflatorFn"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"
import {
  getInflatedSchematicComponent,
  getInflatedSchematicProps,
} from "./getInflatedSchematicComponent"
import { inflateFootprintComponent } from "./inflateFootprintComponent"

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

const getInflatedChipPinLabels = (
  sourceComponentId: string,
  inflatorContext: InflatorContext,
): Record<string, string> | undefined => {
  const pinLabels = Object.fromEntries(
    inflatorContext.injectionDb.source_port
      .list()
      .filter(
        (sourcePort) =>
          sourcePort.source_component_id === sourceComponentId &&
          typeof sourcePort.pin_number === "number",
      )
      .map((sourcePort) => [`pin${sourcePort.pin_number}`, sourcePort.name]),
  )

  return Object.keys(pinLabels).length > 0 ? pinLabels : undefined
}

export const inflateSourceChip = (
  sourceElm: SourceSimpleChip,
  inflatorContext: InflatorContext,
) => {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  const pcbElm = injectionDb.pcb_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as PcbComponent | null

  const schematicElm = getInflatedSchematicComponent(
    sourceElm.source_component_id,
    inflatorContext,
  )

  const cadElm = injectionDb.cad_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as CadComponent | null

  const internallyConnectedPins =
    mapInternallyConnectedSourcePortIdsToPinLabels(
      sourceElm.internally_connected_source_port_ids,
      inflatorContext,
    )
  const pinLabels = getInflatedChipPinLabels(
    sourceElm.source_component_id,
    inflatorContext,
  )
  const schematicProps = getInflatedSchematicProps(
    schematicElm,
    inflatorContext,
  )

  const footprinterString = cadElm?.footprinter_string ?? null
  const { pcbX, pcbY } = getInflatedPcbPlacement({
    pcbComponent: pcbElm,
    sourceGroupId: sourceElm.source_group_id,
    inflatorContext,
  })

  const chip = new Chip({
    ...schematicProps,
    name: sourceElm.name,
    manufacturerPartNumber: sourceElm.manufacturer_part_number,
    supplierPartNumbers: sourceElm.supplier_part_numbers ?? undefined,
    pinLabels,
    schWidth: schematicElm?.size?.width,
    schHeight: schematicElm?.size?.height,
    schPinSpacing: schematicElm?.pin_spacing,
    layer: pcbElm?.layer,
    pcbX,
    pcbY,
    pcbRotation: pcbElm?.rotation,
    doNotPlace: pcbElm?.do_not_place ?? true,
    obstructsWithinBounds: pcbElm?.obstructs_within_bounds,
    internallyConnectedPins,
  })

  // Store the footprinter string in props for reference (used by cad_component generation)
  if (footprinterString) {
    Object.assign(chip.props, { footprint: footprinterString })
    Object.assign(chip._parsedProps, { footprint: footprinterString })
  }

  // Create a Footprint component from the PCB primitives in the circuit JSON
  // This properly wraps all pads, holes, silkscreen, etc. in a Footprint component
  if (pcbElm) {
    const footprint = inflateFootprintComponent(pcbElm, {
      ...inflatorContext,
      normalComponent: chip,
    })

    if (footprint) {
      chip.add(footprint)
    }
  }

  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(chip)
  } else {
    subcircuit.add(chip)
  }
}
