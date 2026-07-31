import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type {
  ComponentId,
  InputComponent,
  PackInput,
  PadId,
} from "calculate-packing"
import type {
  PcbPlatedHole,
  PcbPort,
  PcbSmtPad,
  SourcePort,
} from "circuit-json"
import { getDecouplingCapacitorRelationships } from "lib/utils/decoupling-capacitors/get-decoupling-capacitor-relationships"

type SourcePortId = SourcePort["source_port_id"]
type PcbPortId = PcbPort["pcb_port_id"]
type PcbSmtPadId = PcbSmtPad["pcb_smtpad_id"]
type PcbPlatedHoleId = PcbPlatedHole["pcb_plated_hole_id"]

type PhysicalPadId = PcbSmtPadId | PcbPlatedHoleId

const getConnectionKey = (firstPadId: PadId, secondPadId: PadId) =>
  firstPadId < secondPadId
    ? `${firstPadId}\0${secondPadId}`
    : `${secondPadId}\0${firstPadId}`

const appendPhysicalPadId = (
  physicalPadIdsByPcbPortId: Map<PcbPortId, PhysicalPadId[]>,
  pcbPortId: PcbPortId | undefined,
  physicalPadId: PhysicalPadId,
) => {
  if (!pcbPortId) return

  const physicalPadIds = physicalPadIdsByPcbPortId.get(pcbPortId) ?? []
  physicalPadIds.push(physicalPadId)
  physicalPadIdsByPcbPortId.set(pcbPortId, physicalPadIds)
}

const getPhysicalPadIdsBySourcePortId = (
  db: CircuitJsonUtilObjects,
  packComponentByPadId: Map<PadId, InputComponent>,
) => {
  const physicalPadIdsByPcbPortId = new Map<PcbPortId, PhysicalPadId[]>()

  for (const pcbSmtPad of db.pcb_smtpad.list()) {
    if (!packComponentByPadId.has(pcbSmtPad.pcb_smtpad_id)) continue
    appendPhysicalPadId(
      physicalPadIdsByPcbPortId,
      pcbSmtPad.pcb_port_id,
      pcbSmtPad.pcb_smtpad_id,
    )
  }

  for (const pcbPlatedHole of db.pcb_plated_hole.list()) {
    if (!packComponentByPadId.has(pcbPlatedHole.pcb_plated_hole_id)) continue
    appendPhysicalPadId(
      physicalPadIdsByPcbPortId,
      pcbPlatedHole.pcb_port_id,
      pcbPlatedHole.pcb_plated_hole_id,
    )
  }

  const physicalPadIdsBySourcePortId = new Map<SourcePortId, PhysicalPadId[]>()
  for (const pcbPort of db.pcb_port.list()) {
    const physicalPadIds =
      physicalPadIdsByPcbPortId.get(pcbPort.pcb_port_id) ?? []
    if (physicalPadIds.length === 0) continue

    const existingPhysicalPadIds =
      physicalPadIdsBySourcePortId.get(pcbPort.source_port_id) ?? []
    existingPhysicalPadIds.push(...physicalPadIds)
    physicalPadIdsBySourcePortId.set(
      pcbPort.source_port_id,
      existingPhysicalPadIds,
    )
  }

  return physicalPadIdsBySourcePortId
}

const setDecouplingCapacitorPackOrder = (
  packInput: PackInput,
  capacitorComponentIdsByChipComponentId: Map<ComponentId, Set<ComponentId>>,
) => {
  if (capacitorComponentIdsByChipComponentId.size === 0) return

  const existingPackFirstIndexByComponentId = new Map(
    packInput.packFirst?.map((componentId, index) => [componentId, index]),
  )
  const dynamicComponents = packInput.components
    .filter((packComponent) => !packComponent.isStatic)
    .sort((firstPackComponent, secondPackComponent) => {
      const firstPackFirstIndex = existingPackFirstIndexByComponentId.get(
        firstPackComponent.componentId,
      )
      const secondPackFirstIndex = existingPackFirstIndexByComponentId.get(
        secondPackComponent.componentId,
      )
      if (
        firstPackFirstIndex !== undefined &&
        secondPackFirstIndex !== undefined
      ) {
        return firstPackFirstIndex - secondPackFirstIndex
      }
      if (firstPackFirstIndex !== undefined) return -1
      if (secondPackFirstIndex !== undefined) return 1
      return secondPackComponent.pads.length - firstPackComponent.pads.length
    })
  const dynamicComponentIds = new Set(
    dynamicComponents.map((packComponent) => packComponent.componentId),
  )
  const capacitorComponentIds = new Set(
    Array.from(capacitorComponentIdsByChipComponentId.values()).flatMap(
      (componentIds) => Array.from(componentIds),
    ),
  )
  const orderedComponentIds: ComponentId[] = []

  for (const [
    chipComponentId,
    chipCapacitorComponentIds,
  ] of capacitorComponentIdsByChipComponentId) {
    if (dynamicComponentIds.has(chipComponentId)) continue
    for (const capacitorComponentId of chipCapacitorComponentIds) {
      if (dynamicComponentIds.has(capacitorComponentId)) {
        orderedComponentIds.push(capacitorComponentId)
      }
    }
  }

  for (const packComponent of dynamicComponents) {
    if (capacitorComponentIds.has(packComponent.componentId)) continue
    orderedComponentIds.push(packComponent.componentId)

    const chipCapacitorComponentIds =
      capacitorComponentIdsByChipComponentId.get(packComponent.componentId)
    if (!chipCapacitorComponentIds) continue
    for (const capacitorComponentId of chipCapacitorComponentIds) {
      if (dynamicComponentIds.has(capacitorComponentId)) {
        orderedComponentIds.push(capacitorComponentId)
      }
    }
  }

  packInput.packFirst = orderedComponentIds
}

/**
 * Strengthens the packer's physical connection between a chip power pad and
 * its decoupling capacitor and moves only the capacitor next to its chip in the
 * existing pack order. Static components remain fixed.
 */
export const applyDecouplingCapacitorPacking = (
  db: CircuitJsonUtilObjects,
  packInput: PackInput,
) => {
  const packComponentByPadId = new Map<PadId, InputComponent>()
  for (const packComponent of packInput.components) {
    for (const packPad of packComponent.pads) {
      packComponentByPadId.set(packPad.padId, packComponent)
    }
  }

  const physicalPadIdsBySourcePortId = getPhysicalPadIdsBySourcePortId(
    db,
    packComponentByPadId,
  )
  const connectionKeys = new Set(
    packInput.weightedConnections
      ?.filter(({ padIds }) => padIds.length === 2)
      .map(({ padIds }) => getConnectionKey(padIds[0], padIds[1])) ?? [],
  )
  const weightedConnections = [...(packInput.weightedConnections ?? [])]
  const capacitorComponentIdsByChipComponentId = new Map<
    ComponentId,
    Set<ComponentId>
  >()
  for (const relationship of getDecouplingCapacitorRelationships(db)) {
    const chipPadIds =
      physicalPadIdsBySourcePortId.get(
        relationship.chipPowerSourcePort.source_port_id,
      ) ?? []
    const capacitorPadIds =
      physicalPadIdsBySourcePortId.get(
        relationship.capacitorPowerSourcePort.source_port_id,
      ) ?? []

    for (const chipPadId of chipPadIds) {
      const chipPackComponent = packComponentByPadId.get(chipPadId)
      if (!chipPackComponent) continue

      for (const capacitorPadId of capacitorPadIds) {
        const capacitorPackComponent = packComponentByPadId.get(capacitorPadId)
        if (
          !capacitorPackComponent ||
          capacitorPackComponent.componentId === chipPackComponent.componentId
        ) {
          continue
        }

        const connectionKey = getConnectionKey(chipPadId, capacitorPadId)
        if (!connectionKeys.has(connectionKey)) {
          weightedConnections.push({
            padIds: [chipPadId, capacitorPadId],
            weight: 1,
            ignoreWeakConnections: true,
          })
          connectionKeys.add(connectionKey)
        }

        const capacitorComponentIds =
          capacitorComponentIdsByChipComponentId.get(
            chipPackComponent.componentId,
          ) ?? new Set<ComponentId>()
        capacitorComponentIds.add(capacitorPackComponent.componentId)
        capacitorComponentIdsByChipComponentId.set(
          chipPackComponent.componentId,
          capacitorComponentIds,
        )
      }
    }
  }

  if (weightedConnections.length > 0) {
    packInput.weightedConnections = weightedConnections
  }
  setDecouplingCapacitorPackOrder(
    packInput,
    capacitorComponentIdsByChipComponentId,
  )
}
