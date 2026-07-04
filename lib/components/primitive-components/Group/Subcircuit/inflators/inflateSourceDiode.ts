import type { PcbComponent, SourcePort, SourceSimpleDiode } from "circuit-json"
import { Diode } from "lib/components/normal-components/Diode"
import type { InflatorContext } from "../InflatorFn"
import { inflateFootprintComponent } from "./inflateFootprintComponent"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"

const getLabels = (sourcePort: SourcePort | undefined) =>
  Array.from(
    new Set(
      [sourcePort?.name, ...(sourcePort?.port_hints ?? [])].filter(
        (label): label is string =>
          typeof label === "string" && label.length > 0,
      ),
    ),
  )

const getImportedDiodePinLabels = (
  sourceElm: SourceSimpleDiode,
  inflatorContext: InflatorContext,
): Record<string, string[]> | undefined => {
  const sourcePorts = inflatorContext.injectionDb.source_port
    .list()
    .filter(
      (port) => port.source_component_id === sourceElm.source_component_id,
    ) as SourcePort[]

  const pinLabels: Record<string, string[]> = {}
  for (const sourcePort of sourcePorts) {
    if (sourcePort.pin_number === undefined || sourcePort.pin_number === null) {
      continue
    }
    const labels = getLabels(sourcePort)
    if (labels.length === 0) continue
    pinLabels[`pin${sourcePort.pin_number}`] = labels
  }

  return Object.keys(pinLabels).length > 0 ? pinLabels : undefined
}

export function inflateSourceDiode(
  sourceElm: SourceSimpleDiode,
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

  const importedPinLabels = getImportedDiodePinLabels(
    sourceElm,
    inflatorContext,
  )

  const diodeProps = {
    name: sourceElm.name,
    manufacturerPartNumber: sourceElm.manufacturer_part_number,
    supplierPartNumbers: sourceElm.supplier_part_numbers ?? undefined,
    pinLabels: importedPinLabels,
    layer: pcbElm?.layer,
    pcbX,
    pcbY,
    pcbRotation: pcbElm?.rotation,
    doNotPlace: pcbElm?.do_not_place,
    obstructsWithinBounds: pcbElm?.obstructs_within_bounds,
  }

  const diode = new Diode(diodeProps)

  // Create a Footprint component from the PCB primitives in the circuit JSON
  if (pcbElm) {
    const footprint = inflateFootprintComponent(pcbElm, {
      ...inflatorContext,
      normalComponent: diode,
    })

    if (footprint) {
      diode.add(footprint)
    }
  }

  // Add the diode to its group if it has one, otherwise add to subcircuit
  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(diode)
  } else {
    subcircuit.add(diode)
  }
}
