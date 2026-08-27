import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type {
  LayerRef,
  PcbComponent,
  PcbPort,
  PcbSmtPad,
  PcbSmtPadRect,
  SourceComponentBase,
  SourceComponentInternalConnection,
  SourcePort,
} from "circuit-json"

type SourceComponentId = SourceComponentBase["source_component_id"]
type SourcePortId = SourcePort["source_port_id"]
type SourceComponentInternalConnectionId =
  SourceComponentInternalConnection["source_component_internal_connection_id"]
type PcbComponentId = PcbComponent["pcb_component_id"]
type PcbPortId = PcbPort["pcb_port_id"]
type PcbSmtPadId = PcbSmtPad["pcb_smtpad_id"]

export interface AutoplacedJumperMaterialization {
  sourceComponentIds: Set<SourceComponentId>
  sourcePortIds: Set<SourcePortId>
  sourceComponentInternalConnectionIds: Set<SourceComponentInternalConnectionId>
  pcbComponentIds: Set<PcbComponentId>
  pcbPortIds: Set<PcbPortId>
  pcbSmtPadIds: Set<PcbSmtPadId>
  ownedElements: WeakSet<object>
}

export function createAutoplacedJumperMaterialization(): AutoplacedJumperMaterialization {
  return {
    sourceComponentIds: new Set(),
    sourcePortIds: new Set(),
    sourceComponentInternalConnectionIds: new Set(),
    pcbComponentIds: new Set(),
    pcbPortIds: new Set(),
    pcbSmtPadIds: new Set(),
    ownedElements: new WeakSet(),
  }
}

export interface AutoplacedJumperPad {
  center: { x: number; y: number }
  width: number
  height: number
  layer?: string
  layers?: string[]
  connectedTo?: string[]
}

export interface AutoplacedJumper {
  jumper_footprint: string
  center: { x: number; y: number }
  orientation: string
  width?: number
  height?: number
  pads: AutoplacedJumperPad[]
}

/**
 * Group pads by their coordinate perpendicular to the jumper orientation.
 * For vertical jumpers, group by Y; for horizontal jumpers, group by X.
 * Pads in the same group are internally connected.
 */
function groupPadsByInternalConnection(
  pads: AutoplacedJumperPad[],
  orientation: string,
): AutoplacedJumperPad[][] {
  const tolerance = 0.01
  const groups: AutoplacedJumperPad[][] = []

  for (const pad of pads) {
    // For vertical jumpers, pads at same Y are connected
    // For horizontal jumpers, pads at same X are connected
    const key = orientation === "vertical" ? pad.center.y : pad.center.x

    let foundGroup = false
    for (const group of groups) {
      const groupKey =
        orientation === "vertical" ? group[0].center.y : group[0].center.x
      if (Math.abs(key - groupKey) < tolerance) {
        group.push(pad)
        foundGroup = true
        break
      }
    }

    if (!foundGroup) {
      groups.push([pad])
    }
  }

  // Only return groups with 2+ pads (those represent internal connections)
  return groups.filter((g) => g.length >= 2)
}

/**
 * Insert autoplaced jumpers into the database with full circuit JSON elements:
 * - source_component
 * - source_port (one per pad)
 * - source_component_internal_connection (for internally connected pads)
 * - pcb_component
 * - pcb_smtpad (one per pad)
 * - pcb_port (linking source_port to pcb_smtpad)
 */
export function insertAutoplacedJumpers(params: {
  db: CircuitJsonUtilObjects
  output_jumpers: AutoplacedJumper[]
  subcircuit_id?: string | null
  materialization: AutoplacedJumperMaterialization
}): void {
  const { db, output_jumpers, subcircuit_id, materialization } = params

  for (
    let jumperIndex = 0;
    jumperIndex < output_jumpers.length;
    jumperIndex++
  ) {
    const jumper = output_jumpers[jumperIndex]
    const sourceComponent = db.source_component.insert({
      ftype: "simple_chip",
      // Use internal naming convention to avoid conflicts with user-specified names
      name: `__autoplaced_jumper_${jumperIndex}`,
      supplier_part_numbers: {},
    })
    materialization.sourceComponentIds.add(sourceComponent.source_component_id)
    materialization.ownedElements.add(sourceComponent)

    // Calculate rotation from orientation
    const rotation = jumper.orientation === "horizontal" ? 0 : 90

    // Get layer from first pad - may be `layer` string or `layers` array
    const firstPadLayer =
      jumper.pads[0]?.layer || jumper.pads[0]?.layers?.[0] || "top"

    const pcbComponent = db.pcb_component.insert({
      source_component_id: sourceComponent.source_component_id,
      center: jumper.center,
      rotation,
      layer: firstPadLayer as LayerRef,
      width: jumper.width || 0,
      height: jumper.height || 0,
      obstructs_within_bounds: false,
    })
    materialization.pcbComponentIds.add(pcbComponent.pcb_component_id)
    materialization.ownedElements.add(pcbComponent)

    // Track created source_ports and pcb_smtpads for internal connections
    const padData: Array<{
      pad: AutoplacedJumperPad
      sourcePortId: string
      pcbSmtpadId: string
    }> = []

    // Create all pads with source_port, pcb_smtpad, and pcb_port
    for (let padIndex = 0; padIndex < jumper.pads.length; padIndex++) {
      const pad = jumper.pads[padIndex]
      const pinNumber = padIndex + 1

      // Create source_port
      const sourcePort = db.source_port.insert({
        source_component_id: sourceComponent.source_component_id,
        name: `pin${pinNumber}`,
        pin_number: pinNumber,
      })
      materialization.sourcePortIds.add(sourcePort.source_port_id)
      materialization.ownedElements.add(sourcePort)

      // Get layer from pad - may be `layer` string or `layers` array
      const padLayer = pad.layer || pad.layers?.[0] || "top"

      // Create pcb_port linking source_port to pcb_smtpad
      const pcbPort = db.pcb_port.insert({
        pcb_component_id: pcbComponent.pcb_component_id,
        source_port_id: sourcePort.source_port_id,
        x: pad.center.x,
        y: pad.center.y,
        layers: [padLayer as LayerRef],
      })
      materialization.pcbPortIds.add(pcbPort.pcb_port_id)
      materialization.ownedElements.add(pcbPort)

      // Create pcb_smtpad with link to pcb_port
      const pcbSmtpad = db.pcb_smtpad.insert({
        pcb_component_id: pcbComponent.pcb_component_id,
        pcb_port_id: pcbPort.pcb_port_id,
        shape: "rect",
        x: pad.center.x,
        y: pad.center.y,
        width: pad.width,
        height: pad.height,
        layer: padLayer as LayerRef,
      } as PcbSmtPadRect)
      materialization.pcbSmtPadIds.add(pcbSmtpad.pcb_smtpad_id)
      materialization.ownedElements.add(pcbSmtpad)

      padData.push({
        pad,
        sourcePortId: sourcePort.source_port_id,
        pcbSmtpadId: pcbSmtpad.pcb_smtpad_id,
      })
    }

    // Create source_component_internal_connection entries for internally connected pads
    const internalGroups = groupPadsByInternalConnection(
      jumper.pads,
      jumper.orientation,
    )

    for (const group of internalGroups) {
      // Find the source_port_ids for pads in this group
      const sourcePortIds: string[] = []
      for (const groupPad of group) {
        const padInfo = padData.find(
          (p) =>
            Math.abs(p.pad.center.x - groupPad.center.x) < 0.01 &&
            Math.abs(p.pad.center.y - groupPad.center.y) < 0.01,
        )
        if (padInfo) {
          sourcePortIds.push(padInfo.sourcePortId)
        }
      }

      if (sourcePortIds.length >= 2) {
        const internalConnection =
          db.source_component_internal_connection.insert({
            source_component_id: sourceComponent.source_component_id,
            subcircuit_id: subcircuit_id ?? undefined,
            source_port_ids: sourcePortIds,
          })
        materialization.sourceComponentInternalConnectionIds.add(
          internalConnection.source_component_internal_connection_id,
        )
        materialization.ownedElements.add(internalConnection)
      }
    }
  }
}
