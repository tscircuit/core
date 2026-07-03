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

const hasLabel = (labels: string[], matches: string[]) =>
  labels.some((label) => matches.includes(label.trim().toLowerCase()))

const getImportedDiodePinAliases = (
  sourceElm: SourceSimpleDiode,
  inflatorContext: InflatorContext,
): Record<number, string[]> | undefined => {
  const sourcePorts = inflatorContext.injectionDb.source_port
    .list()
    .filter(
      (port) => port.source_component_id === sourceElm.source_component_id,
    ) as SourcePort[]

  const pin1Labels = getLabels(
    sourcePorts.find((port) => port.pin_number === 1),
  )
  const pin2Labels = getLabels(
    sourcePorts.find((port) => port.pin_number === 2),
  )
  if (
    !hasLabel(pin1Labels, ["k", "c", "cathode", "neg", "-"]) &&
    !hasLabel(pin2Labels, ["a", "anode", "pos", "+"])
  ) {
    return undefined
  }

  return {
    1: [...pin1Labels, "cathode", "neg"],
    2: [...pin2Labels, "anode", "pos"],
  }
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

  const diode = new Diode({
    name: sourceElm.name,
    manufacturerPartNumber: sourceElm.manufacturer_part_number,
    supplierPartNumbers: sourceElm.supplier_part_numbers ?? undefined,
    layer: pcbElm?.layer,
    pcbX,
    pcbY,
    pcbRotation: pcbElm?.rotation,
    doNotPlace: pcbElm?.do_not_place,
    obstructsWithinBounds: pcbElm?.obstructs_within_bounds,
  })
  diode._importedPinAliases = getImportedDiodePinAliases(
    sourceElm,
    inflatorContext,
  )

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
