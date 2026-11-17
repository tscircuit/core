import type { SourceComponentBase, SourcePort } from "circuit-json"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { InflatorContext } from "../InflatorFn"

type SourceComponentId = SourceComponentBase["source_component_id"]
type SourcePortId = SourcePort["source_port_id"]

/** Restore records after inflated components have allocated their source IDs. */
class InflatedSimulation extends PrimitiveComponent {
  constructor(private inflationCtx: InflatorContext) {
    super({})
  }

  get config() {
    return { ...super.config, componentName: "InflatedSimulation" }
  }

  doInitialSimulationRender() {
    if (this.getInheritedProperty("analogSimulationDisabled")) return
    restoreSimulationRecords(this.inflationCtx)
  }
}

function restoreSimulationRecords({
  injectionDb,
  subcircuit,
  groupsMap,
}: InflatorContext) {
  const { db } = subcircuit.root!
  const componentIdMap = new Map<SourceComponentId, SourceComponentId>()
  const portIdMap = new Map<SourcePortId, SourcePortId>()
  const remapComponentId = (originalId: SourceComponentId) => {
    const restoredId = componentIdMap.get(originalId)
    if (restoredId) return restoredId
    const original = injectionDb.source_component.get(originalId)
    const group = original?.source_group_id
      ? groupsMap?.get(original.source_group_id)
      : subcircuit
    const components =
      original && group?.source_group_id
        ? db.source_component.list({
            source_group_id: group.source_group_id,
            name: original.name,
          })
        : []
    if (components.length !== 1)
      throw new Error(
        "Cannot restore simulation records: unable to remap source_component_id safely.",
      )
    const { source_component_id } = components[0]
    componentIdMap.set(originalId, source_component_id)
    return source_component_id
  }

  const remapPortId = (originalId: SourcePortId) => {
    const restoredId = portIdMap.get(originalId)
    if (restoredId) return restoredId
    const original = injectionDb.source_port.get(originalId)
    // The inflator cannot reliably reconstruct group ports.
    const ports = original?.source_component_id
      ? db.source_port
          .list({
            source_component_id: remapComponentId(original.source_component_id),
          })
          .filter((port) =>
            original.pin_number !== undefined
              ? port.pin_number === original.pin_number
              : port.name === original.name,
          )
      : []
    if (ports.length !== 1)
      throw new Error(
        "Cannot restore simulation records: unable to remap source_port_id safely.",
      )
    const { source_port_id } = ports[0]
    portIdMap.set(originalId, source_port_id)
    return source_port_id
  }

  const remapPinMap = (pins: Record<string, SourcePortId>) =>
    Object.fromEntries(
      Object.entries(pins).map(([pin, portId]) => [pin, remapPortId(portId)]),
    )

  for (const model of injectionDb.simulation_ibis_model.list()) {
    const {
      type,
      simulation_ibis_model_id,
      ibis_pin_name_to_reference_source_port_ids: referencePortsByPin,
      ...fields
    } = model
    db.simulation_ibis_model.insert({
      ...fields,
      source_component_id: remapComponentId(model.source_component_id),
      ibis_pin_name_to_source_port_id: remapPinMap(
        model.ibis_pin_name_to_source_port_id,
      ),
      ...(referencePortsByPin
        ? {
            ibis_pin_name_to_reference_source_port_ids: Object.fromEntries(
              Object.entries(referencePortsByPin).map(([pin, references]) => [
                pin,
                remapPinMap(references),
              ]),
            ),
          }
        : {}),
    })
  }
}

export function inflateSimulation(inflationCtx: InflatorContext) {
  if (inflationCtx.injectionDb.simulation_ibis_model.list().length === 0) return
  inflationCtx.subcircuit.add(new InflatedSimulation(inflationCtx))
}
