import type { SchematicComponent, SchematicPort } from "circuit-json"
import {
  type InputNetlist,
  SchematicLayoutPipelineSolver,
} from "@tscircuit/schematic-match-adapt"
import type { Group } from "./Group"
import type { z } from "zod"

export function Group_doInitialSchematicLayoutMatchAdapt<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { db } = group.root!

  // Get all schematic components in this group
  const schematicComponents = db.schematic_component
    .list()
    .filter((sc) => sc.schematic_group_id === group.schematic_group_id)

  // If we don't have any components yet, return early
  if (schematicComponents.length === 0) {
    return
  }

  // Create a map of component IDs to their schematic representations
  const componentMap = new Map<string, SchematicComponent>()
  const netMap = new Map<string, string>() // net_id -> netId for InputNetlist

  // Construct an InputNetlist from all children components
  const inputNetlist: InputNetlist = {
    boxes: [],
    connections: [],
    nets: [],
  }

  // Create boxes from schematic components
  for (const sc of schematicComponents) {
    componentMap.set(sc.schematic_component_id, sc)

    // Count pins on each side
    const ports = db.schematic_port
      .list()
      .filter((sp) => sp.schematic_component_id === sc.schematic_component_id)

    let leftPinCount = 0
    let rightPinCount = 0
    let topPinCount = 0
    let bottomPinCount = 0

    for (const port of ports) {
      const side = port.side || group._determineSideFromPosition(port, sc)
      switch (side) {
        case "left":
          leftPinCount++
          break
        case "right":
          rightPinCount++
          break
        case "top":
          topPinCount++
          break
        case "bottom":
          bottomPinCount++
          break
      }
    }

    inputNetlist.boxes.push({
      boxId: sc.schematic_component_id,
      leftPinCount,
      rightPinCount,
      topPinCount,
      bottomPinCount,
    })
  }

  // Create connections from source traces
  const sourceTraces = db.source_trace.list()
  const processedConnections = new Set<string>()

  // Map source component IDs to schematic component IDs
  const sourceToSchematicMap = new Map<string, string>()
  for (const sc of schematicComponents) {
    if (sc.source_component_id) {
      sourceToSchematicMap.set(
        sc.source_component_id,
        sc.schematic_component_id,
      )
    }
  }

  for (const trace of sourceTraces) {
    // Get all ports connected by this trace
    const connectedPorts: Array<
      { boxId: string; pinNumber: number } | { netId: string }
    > = []

    // Add source ports
    if (trace.connected_source_port_ids) {
      for (const sourcePortId of trace.connected_source_port_ids) {
        const sourcePort = db.source_port.get(sourcePortId)
        if (sourcePort && sourcePort.source_component_id) {
          const schematicComponentId = sourceToSchematicMap.get(
            sourcePort.source_component_id,
          )
          if (schematicComponentId) {
            connectedPorts.push({
              boxId: schematicComponentId,
              pinNumber: sourcePort.pin_number || 1,
            })
          }
        }
      }
    }

    // Check if this trace connects to a net
    if (
      trace.connected_source_net_ids &&
      trace.connected_source_net_ids.length > 0
    ) {
      for (const netId of trace.connected_source_net_ids) {
        const net = db.source_net.get(netId)
        if (net) {
          let inputNetlistNetId = netMap.get(net.source_net_id)
          if (!inputNetlistNetId) {
            inputNetlistNetId = `net_${netMap.size + 1}`
            netMap.set(net.source_net_id, inputNetlistNetId)
            inputNetlist.nets.push({ netId: inputNetlistNetId })
          }
          connectedPorts.push({ netId: inputNetlistNetId })
        }
      }
    }

    // Create connection if we have at least 2 ports
    if (connectedPorts.length >= 2) {
      const connectionKey = JSON.stringify(connectedPorts.sort())
      if (!processedConnections.has(connectionKey)) {
        processedConnections.add(connectionKey)
        inputNetlist.connections.push({
          connectedPorts,
        })
      }
    }
  }

  // Run the SchematicLayoutPipelineSolver
  const solver = new SchematicLayoutPipelineSolver({
    inputNetlist,
  })
  solver.solve()

  const circuitLayout = solver.getLayout()

  // Apply the layout to the schematic components
  // The layout solver may return different box IDs, so we need to map by index
  for (let index = 0; index < circuitLayout.boxes.length; index++) {
    const laidOutBox = circuitLayout.boxes[index]
    // Map by index since the solver doesn't preserve our box IDs
    if (index < schematicComponents.length) {
      const component = schematicComponents[index]
      // Update component position
      db.schematic_component.update(component.schematic_component_id, {
        center: {
          x: laidOutBox.centerX,
          y: laidOutBox.centerY,
        },
      })

      // Update port positions
      for (const pin of laidOutBox.pins) {
        const ports = db.schematic_port
          .list()
          .filter(
            (p) =>
              p.schematic_component_id === component.schematic_component_id &&
              p.pin_number === pin.pinNumber,
          )

        for (const port of ports) {
          db.schematic_port.update(port.schematic_port_id, {
            center: {
              x: pin.x,
              y: pin.y,
            },
          })
        }
      }
    }
  }

  // Update schematic group bounds
  const bounds = group._calculateSchematicBounds(circuitLayout.boxes)
  if (group.schematic_group_id) {
    db.schematic_group.update(group.schematic_group_id, {
      center: {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
      },
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
    })
  }
}
