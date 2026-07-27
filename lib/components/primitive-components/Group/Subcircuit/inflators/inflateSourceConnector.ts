import type { ConnectorProps, SchematicPortArrangement } from "@tscircuit/props"
import type {
  CadComponent,
  PcbComponent,
  SchematicComponent,
  SourcePort,
  SourceSimpleConnector,
} from "circuit-json"
import { Connector } from "lib/components/normal-components/Connector"
import type { InflatorContext } from "../InflatorFn"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"
import { inflateFootprintComponent } from "./inflateFootprintComponent"

const getImportedSchPortArrangement = (
  schematicElm: SchematicComponent | null,
): SchematicPortArrangement | undefined => {
  const arrangement = schematicElm?.port_arrangement
  if (!arrangement) return undefined

  if ("left_size" in arrangement) {
    return {
      leftPinCount: arrangement.left_size,
      rightPinCount: arrangement.right_size,
      topPinCount: arrangement.top_size,
      bottomPinCount: arrangement.bottom_size,
    }
  }

  const importedArrangement: SchematicPortArrangement = {}

  if (arrangement.left_side) {
    importedArrangement.leftSide = {
      pins: arrangement.left_side.pins,
      direction: arrangement.left_side.direction ?? "top-to-bottom",
    }
  }
  if (arrangement.right_side) {
    importedArrangement.rightSide = {
      pins: arrangement.right_side.pins,
      direction: arrangement.right_side.direction ?? "top-to-bottom",
    }
  }
  if (arrangement.top_side) {
    importedArrangement.topSide = {
      pins: arrangement.top_side.pins,
      direction: arrangement.top_side.direction ?? "left-to-right",
    }
  }
  if (arrangement.bottom_side) {
    importedArrangement.bottomSide = {
      pins: arrangement.bottom_side.pins,
      direction: arrangement.bottom_side.direction ?? "left-to-right",
    }
  }

  return importedArrangement
}

const getImportedConnectorPinLabels = (
  sourceElm: SourceSimpleConnector,
  inflatorContext: InflatorContext,
): Record<string, string[]> | undefined => {
  const sourcePorts = inflatorContext.injectionDb.source_port
    .list()
    .filter(
      (port) => port.source_component_id === sourceElm.source_component_id,
    ) as SourcePort[]

  const pinLabels: Record<string, string[]> = {}
  for (const sourcePort of sourcePorts) {
    const pinNumber = sourcePort.pin_number
    if (pinNumber === undefined || pinNumber === null) continue

    const labels = Array.from(
      new Set(
        [sourcePort.name, ...(sourcePort.port_hints ?? [])].filter(
          (label): label is string =>
            typeof label === "string" && label.length > 0,
        ),
      ),
    )
    if (labels.length > 0) pinLabels[`pin${pinNumber}`] = labels
  }

  if (Object.keys(pinLabels).length === 0) return undefined
  return pinLabels
}

export function inflateSourceConnector(
  sourceElm: SourceSimpleConnector,
  inflatorContext: InflatorContext,
) {
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

  const { pcbX, pcbY } = getInflatedPcbPlacement({
    pcbComponent: pcbElm,
    sourceGroupId: sourceElm.source_group_id,
    inflatorContext,
  })

  const connectorProps: ConnectorProps = {
    name: sourceElm.name,
    standard: sourceElm.standard,
    manufacturerPartNumber: sourceElm.manufacturer_part_number,
    supplierPartNumbers: sourceElm.supplier_part_numbers ?? undefined,
    pinLabels:
      getImportedConnectorPinLabels(sourceElm, inflatorContext) ??
      schematicElm?.port_labels ??
      undefined,
    schPortArrangement: getImportedSchPortArrangement(schematicElm),
    schWidth: schematicElm?.size?.width,
    schHeight: schematicElm?.size?.height,
    schPinSpacing: schematicElm?.pin_spacing,
    schX: schematicElm?.center?.x,
    schY: schematicElm?.center?.y,
    layer: pcbElm?.layer,
    pcbX,
    pcbY,
    pcbRotation: pcbElm?.rotation,
    doNotPlace: pcbElm?.do_not_place,
    obstructsWithinBounds: pcbElm?.obstructs_within_bounds,
  }
  const connector = new Connector(connectorProps)

  if (cadElm?.footprinter_string) {
    Object.assign(connector.props, { footprint: cadElm.footprinter_string })
    Object.assign(connector._parsedProps, {
      footprint: cadElm.footprinter_string,
    })
  }

  if (pcbElm) {
    const footprint = inflateFootprintComponent(pcbElm, {
      ...inflatorContext,
      normalComponent: connector,
    })
    if (footprint) connector.add(footprint)
  }

  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    groupsMap.get(sourceElm.source_group_id)!.add(connector)
  } else {
    subcircuit.add(connector)
  }
}
