import type { SchematicSheet, SourcePort } from "circuit-json"
import { NormalComponent } from "../../base-components/NormalComponent/NormalComponent"
import { SchematicBox } from "../SchematicBox/SchematicBox"
import { getSchematicBoxPinLabels } from "../SchematicBox/SchematicBox_doInitialSchematicComponentRender"
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
  const schematicBoxReferencedSourceComponentIds = new Set<SourceComponentId>()

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

    schematicBoxReferencedSourceComponentIds.add(
      referencedComponent.source_component_id,
    )
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
      const subcircuitConnectivityMapKey =
        referencedSourcePort?.subcircuit_connectivity_map_key
      if (!subcircuitConnectivityMapKey) continue

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
    if (
      schematicBoxReferencedSourceComponentIds.has(
        normalComponent.source_component_id,
      )
    ) {
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
