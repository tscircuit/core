import type { SchematicSheet, SourcePort } from "circuit-json"
import { NormalComponent } from "../../base-components/NormalComponent/NormalComponent"
import type { Port } from "../Port"
import { SchematicBox } from "../SchematicBox/SchematicBox"
import { getSchematicBoxPinLabels } from "../SchematicBox/SchematicBox_doInitialSchematicComponentRender"
import { SchematicSymbol } from "../SchematicSymbol/SchematicSymbol"
import type { Group } from "./Group"

type SourceComponentId = SourcePort["source_component_id"]
type SchematicSheetId = SchematicSheet["schematic_sheet_id"]
type SubcircuitConnectivityMapKey = NonNullable<
  SourcePort["subcircuit_connectivity_map_key"]
>

export const Group_doInitialAssignSchematicSheetToConnectedComponents = (
  group: Group<any>,
): void => {
  if (!group.isSubcircuit || group.root?.schematicDisabled) return

  const { db } = group.root!
  const schematicSheetIdsBySubcircuitConnectivityMapKey = new Map<
    SubcircuitConnectivityMapKey,
    Set<SchematicSheetId>
  >()
  const projectedSourceComponentIds = new Set<SourceComponentId>()

  const associateSourcePortWithSheet = (
    sourcePort: SourcePort | undefined,
    schematicSheetId: SchematicSheetId,
  ) => {
    const subcircuitConnectivityMapKey =
      sourcePort?.subcircuit_connectivity_map_key
    if (!subcircuitConnectivityMapKey) return

    const schematicSheetIds =
      schematicSheetIdsBySubcircuitConnectivityMapKey.get(
        subcircuitConnectivityMapKey,
      ) ?? new Set<SchematicSheetId>()
    schematicSheetIds.add(schematicSheetId)
    schematicSheetIdsBySubcircuitConnectivityMapKey.set(
      subcircuitConnectivityMapKey,
      schematicSheetIds,
    )
  }

  const schematicBoxes = group
    .getDescendants()
    .filter(
      (component): component is SchematicBox =>
        component instanceof SchematicBox &&
        component.getSubcircuit() === group,
    )

  for (const schematicBox of schematicBoxes) {
    const { chipRef, pinLabels } = schematicBox._parsedProps
    const schematicSheetId = schematicBox._resolveSchematicSheetId()
    if (!chipRef || !schematicSheetId) continue

    const referencedComponent = schematicBox.getSubcircuit().selectOne(chipRef)
    if (!(referencedComponent instanceof NormalComponent)) continue
    if (!referencedComponent.source_component_id) continue

    projectedSourceComponentIds.add(referencedComponent.source_component_id)
    const referencedSourcePorts = db.source_port.list({
      source_component_id: referencedComponent.source_component_id,
    })

    for (const { pinAliases } of getSchematicBoxPinLabels(pinLabels)) {
      const referencedSourcePort = referencedSourcePorts.find((sourcePort) =>
        pinAliases.some(
          (pinAlias) =>
            sourcePort.name === pinAlias ||
            sourcePort.port_hints?.includes(pinAlias),
        ),
      )
      associateSourcePortWithSheet(referencedSourcePort, schematicSheetId)
    }
  }

  const schematicSymbols = group
    .getDescendants()
    .filter(
      (component): component is SchematicSymbol =>
        component instanceof SchematicSymbol &&
        component.getSubcircuit() === group,
    )

  for (const schematicSymbol of schematicSymbols) {
    const { chipRef, connections } = schematicSymbol._parsedProps
    const schematicSheetId = schematicSymbol._resolveSchematicSheetId()
    if (!chipRef || !connections || !schematicSheetId) continue

    const referencedComponent = schematicSymbol
      .getSubcircuit()
      .selectOne(chipRef)
    if (!(referencedComponent instanceof NormalComponent)) continue
    if (!referencedComponent.source_component_id) continue

    projectedSourceComponentIds.add(referencedComponent.source_component_id)

    for (const connectionTarget of Object.values(connections)) {
      const targetSelectors =
        typeof connectionTarget === "string"
          ? [connectionTarget]
          : connectionTarget
      for (const targetSelector of targetSelectors) {
        const referencedPort = schematicSymbol
          .getSubcircuit()
          .selectOne(targetSelector, { type: "port" }) as Port | null
        if (!referencedPort?.source_port_id) continue

        const referencedSourcePort = db.source_port.get(
          referencedPort.source_port_id,
        )
        if (
          referencedSourcePort?.source_component_id !==
          referencedComponent.source_component_id
        ) {
          continue
        }
        associateSourcePortWithSheet(referencedSourcePort, schematicSheetId)
      }
    }
  }

  const normalComponents = group
    .getDescendants()
    .filter(
      (component): component is NormalComponent<any, any> =>
        component instanceof NormalComponent &&
        component.getSubcircuit() === group,
    )

  for (const normalComponent of normalComponents) {
    if (!normalComponent.source_component_id) continue
    if (projectedSourceComponentIds.has(normalComponent.source_component_id)) {
      continue
    }
    if (normalComponent._resolveSchematicSheetId()) continue

    const connectedSchematicSheetIds = new Set<SchematicSheetId>()
    const sourcePorts = db.source_port.list({
      source_component_id: normalComponent.source_component_id,
    })
    for (const sourcePort of sourcePorts) {
      const subcircuitConnectivityMapKey =
        sourcePort.subcircuit_connectivity_map_key
      if (!subcircuitConnectivityMapKey) continue

      const schematicSheetIds =
        schematicSheetIdsBySubcircuitConnectivityMapKey.get(
          subcircuitConnectivityMapKey,
        )
      if (!schematicSheetIds) continue
      for (const schematicSheetId of schematicSheetIds) {
        connectedSchematicSheetIds.add(schematicSheetId)
      }
    }

    if (connectedSchematicSheetIds.size !== 1) continue
    const [inferredSchematicSheetId] = connectedSchematicSheetIds
    if (!inferredSchematicSheetId) continue
    normalComponent.schematic_sheet_id = inferredSchematicSheetId
  }
}
