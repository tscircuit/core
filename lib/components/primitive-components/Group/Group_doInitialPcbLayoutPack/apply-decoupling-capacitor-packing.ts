import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { InputComponent, PackInput, PadId } from "calculate-packing"
import type {
  PcbPlatedHole,
  PcbPort,
  PcbSmtPad,
  SourcePort,
} from "circuit-json"
import type { DecouplingCapacitorRelationship } from "lib/utils/decoupling-capacitors/get-decoupling-capacitor-relationships"

type SourcePortId = SourcePort["source_port_id"]
type PcbPortId = PcbPort["pcb_port_id"]
type PcbSmtPadId = PcbSmtPad["pcb_smtpad_id"]
type PcbPlatedHoleId = PcbPlatedHole["pcb_plated_hole_id"]
type PhysicalPadId = PcbSmtPadId | PcbPlatedHoleId
type PhysicalPadConnectionKey = string & {
  readonly __brand: "PhysicalPadConnectionKey"
}

const getPhysicalPadConnectionKey = (
  firstPhysicalPadId: PadId,
  secondPhysicalPadId: PadId,
): PhysicalPadConnectionKey =>
  (firstPhysicalPadId < secondPhysicalPadId
    ? `${firstPhysicalPadId}\0${secondPhysicalPadId}`
    : `${secondPhysicalPadId}\0${firstPhysicalPadId}`) as PhysicalPadConnectionKey

const getPhysicalPadIdsBySourcePortId = (
  db: CircuitJsonUtilObjects,
): Map<SourcePortId, PhysicalPadId[]> => {
  const sourcePortIdByPcbPortId = new Map<PcbPortId, SourcePortId>(
    db.pcb_port
      .list()
      .map((pcbPort) => [pcbPort.pcb_port_id, pcbPort.source_port_id]),
  )
  const physicalPadIdsBySourcePortId = new Map<SourcePortId, PhysicalPadId[]>()
  const addPhysicalPad = (
    pcbPortId: PcbPortId | undefined,
    physicalPadId: PhysicalPadId,
  ) => {
    if (!pcbPortId) return
    const sourcePortId = sourcePortIdByPcbPortId.get(pcbPortId)
    if (!sourcePortId) return
    const physicalPadIds = physicalPadIdsBySourcePortId.get(sourcePortId) ?? []
    physicalPadIds.push(physicalPadId)
    physicalPadIdsBySourcePortId.set(sourcePortId, physicalPadIds)
  }

  for (const pcbSmtPad of db.pcb_smtpad.list()) {
    addPhysicalPad(pcbSmtPad.pcb_port_id, pcbSmtPad.pcb_smtpad_id)
  }
  for (const pcbPlatedHole of db.pcb_plated_hole.list()) {
    addPhysicalPad(pcbPlatedHole.pcb_port_id, pcbPlatedHole.pcb_plated_hole_id)
  }

  return physicalPadIdsBySourcePortId
}

export const applyDecouplingCapacitorPacking = (
  db: CircuitJsonUtilObjects,
  packInput: PackInput,
  decouplingCapacitorRelationships: DecouplingCapacitorRelationship[],
): void => {
  const packComponentByPadId = new Map<PadId, InputComponent>()
  for (const packComponent of packInput.components) {
    for (const packPad of packComponent.pads) {
      packComponentByPadId.set(packPad.padId, packComponent)
    }
  }
  const physicalPadIdsBySourcePortId = getPhysicalPadIdsBySourcePortId(db)
  const weightedConnections = [...(packInput.weightedConnections ?? [])]
  const weightedConnectionIndexByPhysicalPadConnectionKey = new Map<
    PhysicalPadConnectionKey,
    number
  >()
  for (const [
    connectionIndex,
    weightedConnection,
  ] of weightedConnections.entries()) {
    if (weightedConnection.padIds.length !== 2) continue
    weightedConnectionIndexByPhysicalPadConnectionKey.set(
      getPhysicalPadConnectionKey(
        weightedConnection.padIds[0],
        weightedConnection.padIds[1],
      ),
      connectionIndex,
    )
  }
  for (const relationship of decouplingCapacitorRelationships) {
    const chipPowerPadIds =
      physicalPadIdsBySourcePortId.get(
        relationship.chipPowerSourcePort.source_port_id,
      ) ?? []
    const capacitorPowerPadIds =
      physicalPadIdsBySourcePortId.get(
        relationship.capacitorPowerSourcePort.source_port_id,
      ) ?? []

    for (const chipPowerPadId of chipPowerPadIds) {
      for (const capacitorPowerPadId of capacitorPowerPadIds) {
        const capacitorPackComponent =
          packComponentByPadId.get(capacitorPowerPadId)
        if (!capacitorPackComponent) continue

        const chipPackComponent = packComponentByPadId.get(chipPowerPadId)
        if (!chipPackComponent) continue
        if (
          capacitorPackComponent.componentId === chipPackComponent.componentId
        ) {
          continue
        }

        const physicalPadConnectionKey = getPhysicalPadConnectionKey(
          chipPowerPadId,
          capacitorPowerPadId,
        )
        const weightedConnectionIndex =
          weightedConnectionIndexByPhysicalPadConnectionKey.get(
            physicalPadConnectionKey,
          )
        if (weightedConnectionIndex === undefined) {
          weightedConnections.push({
            padIds: [chipPowerPadId, capacitorPowerPadId],
            weight: 1,
            ignoreWeakConnections: true,
          })
          weightedConnectionIndexByPhysicalPadConnectionKey.set(
            physicalPadConnectionKey,
            weightedConnections.length - 1,
          )
        } else if (
          !weightedConnections[weightedConnectionIndex].ignoreWeakConnections
        ) {
          weightedConnections[weightedConnectionIndex] = {
            ...weightedConnections[weightedConnectionIndex],
            ignoreWeakConnections: true,
          }
        }
      }
    }
  }

  if (weightedConnections.length > 0) {
    packInput.weightedConnections = weightedConnections
  }
}
