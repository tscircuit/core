import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { AutoplacedJumperMaterialization } from "./insert-autoplaced-jumpers"

/**
 * Remove only the Circuit JSON records created by this Group's previous
 * autoplaced-jumper materialization. User-authored components are never
 * discovered by name or geometry.
 */
export function removeAutoplacedJumperMaterialization({
  db,
  materialization,
}: {
  db: CircuitJsonUtilObjects
  materialization: AutoplacedJumperMaterialization
}) {
  for (const pcbSmtPadId of materialization.pcbSmtPadIds) {
    const pcbSmtPad = db.pcb_smtpad.get(pcbSmtPadId)
    if (pcbSmtPad && materialization.ownedElements.has(pcbSmtPad)) {
      db.pcb_smtpad.delete(pcbSmtPadId)
    }
  }
  for (const pcbPortId of materialization.pcbPortIds) {
    const pcbPort = db.pcb_port.get(pcbPortId)
    if (pcbPort && materialization.ownedElements.has(pcbPort)) {
      db.pcb_port.delete(pcbPortId)
    }
  }
  for (const pcbComponentId of materialization.pcbComponentIds) {
    const pcbComponent = db.pcb_component.get(pcbComponentId)
    if (pcbComponent && materialization.ownedElements.has(pcbComponent)) {
      db.pcb_component.delete(pcbComponentId)
    }
  }
  for (const internalConnectionId of materialization.sourceComponentInternalConnectionIds) {
    const internalConnection =
      db.source_component_internal_connection.get(internalConnectionId)
    if (
      internalConnection &&
      materialization.ownedElements.has(internalConnection)
    ) {
      db.source_component_internal_connection.delete(internalConnectionId)
    }
  }
  for (const sourcePortId of materialization.sourcePortIds) {
    const sourcePort = db.source_port.get(sourcePortId)
    if (sourcePort && materialization.ownedElements.has(sourcePort)) {
      db.source_port.delete(sourcePortId)
    }
  }
  for (const sourceComponentId of materialization.sourceComponentIds) {
    const sourceComponent = db.source_component.get(sourceComponentId)
    if (sourceComponent && materialization.ownedElements.has(sourceComponent)) {
      db.source_component.delete(sourceComponentId)
    }
  }
}
