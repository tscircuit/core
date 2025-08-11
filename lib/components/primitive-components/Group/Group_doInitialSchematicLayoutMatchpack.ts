import {
  getCircuitJsonTree,
  type CircuitJsonTreeNode,
} from "@tscircuit/circuit-json-util"
import {
  LayoutPipelineSolver,
  type InputProblem,
  type Chip,
  type ChipPin,
  type Net,
} from "@tscircuit/matchpack"
import Debug from "debug"
import type { Group } from "./Group"
import type { z } from "zod"

const debug = Debug("Group_doInitialSchematicLayoutMatchpack")

// Create conversion function
function convertTreeToInputProblem(
  tree: CircuitJsonTreeNode,
  db: any,
): InputProblem {
  const problem: InputProblem = {
    chipMap: {},
    chipPinMap: {},
    groupMap: {},
    groupPinMap: {},
    netMap: {},
    pinStrongConnMap: {},
    netConnMap: {},
  }

  // Process each top-level child as a "composite chip"
  tree.childNodes.forEach((child, index) => {
    if (child.nodeType === "component" && child.sourceComponent) {
      const chipId = child.sourceComponent.name || `chip_${index}`
      const schematicComponent = db.schematic_component.getWhere({
        source_component_id: child.sourceComponent.source_component_id,
      })

      if (!schematicComponent) return

      // Create chip entry
      problem.chipMap[chipId] = {
        chipId,
        pins: [],
        size: {
          x: schematicComponent.size?.width || 1,
          y: schematicComponent.size?.height || 1,
        },
      }

      // Get ports for this component
      const ports = db.schematic_port.list({
        schematic_component_id: schematicComponent.schematic_component_id,
      })

      for (const port of ports) {
        const sourcePort = db.source_port.get(port.source_port_id)
        if (!sourcePort) continue

        const pinId = `${chipId}.${sourcePort.pin_number || sourcePort.name || port.schematic_port_id}`
        problem.chipMap[chipId].pins.push(pinId)

        // Map facing direction to side
        let side: "x-" | "x+" | "y-" | "y+" = "y+"
        switch (port.facing_direction) {
          case "up":
            side = "y+"
            break
          case "down":
            side = "y-"
            break
          case "left":
            side = "x-"
            break
          case "right":
            side = "x+"
            break
        }

        problem.chipPinMap[pinId] = {
          pinId,
          offset: {
            x: (port.center?.x || 0) - (schematicComponent.center.x || 0),
            y: (port.center?.y || 0) - (schematicComponent.center.y || 0),
          },
          side,
        }
      }
    } else if (child.nodeType === "group" && child.sourceGroup) {
      // Handle nested groups as composite chips
      const groupId = child.sourceGroup.name || `group_${index}`
      const schematicGroup = db.schematic_group?.getWhere?.({
        source_group_id: child.sourceGroup.source_group_id,
      })

      if (schematicGroup) {
        // For now, treat groups as chips with their bounding box as size
        problem.chipMap[groupId] = {
          chipId: groupId,
          pins: [],
          size: {
            x: schematicGroup.size?.width || 2,
            y: schematicGroup.size?.height || 2,
          },
        }
      }
    }
  })

  // Create connections based on traces
  const sourceTraces = db.source_trace.list()
  const sourceNets = db.source_net.list()
  // Create nets
  for (const net of sourceNets) {
    problem.netMap[net.name || net.source_net_id] = {
      netId: net.name || net.source_net_id,
    }
  }

  // Process traces to create connections
  for (const trace of sourceTraces) {
    const connectedPorts = trace.connected_source_port_ids || []
    const connectedNets = trace.connected_source_net_ids || []

    // Find which pins belong to our composite chips
    const relevantPins: string[] = []
    for (const portId of connectedPorts) {
      const sourcePort = db.source_port.get(portId)
      if (!sourcePort) continue

      // Find which chip this port belongs to
      for (const [chipId, chip] of Object.entries(problem.chipMap)) {
        const chipSourceComponent = tree.childNodes.find(
          (n) => n.sourceComponent?.name === chipId,
        )?.sourceComponent

        if (chipSourceComponent) {
          const isPortInComponent = db.source_port
            .list({
              source_component_id: chipSourceComponent.source_component_id,
            })
            .some((p: any) => p.source_port_id === portId)

          if (isPortInComponent) {
            const pinId = chip.pins.find((p) =>
              p.includes(sourcePort.pin_number || sourcePort.name),
            )
            if (pinId) relevantPins.push(pinId)
          }
        }
      }
    }

    // Create strong connections for 2-pin traces without nets
    if (relevantPins.length === 2 && connectedNets.length === 0) {
      const [pin1, pin2] = relevantPins
      problem.pinStrongConnMap[`${pin1}-${pin2}`] = true
      problem.pinStrongConnMap[`${pin2}-${pin1}`] = true
    }
    // Create net connections
    for (const pinId of relevantPins) {
      for (const netId of connectedNets) {
        const net = db.source_net.get(netId)
        const netName = net?.name || netId
        problem.netConnMap[`${pinId}-${netName}`] = true
      }
    }
  }

  return problem
}

export function Group_doInitialSchematicLayoutMatchPack<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { db } = group.root!

  // Get the tree structure - top level children are "composite chips"
  const tree = getCircuitJsonTree(db.toArray(), {
    source_group_id: group.source_group_id!,
  })

  debug("Converting circuit tree to InputProblem...")
  const inputProblem = convertTreeToInputProblem(tree, db)

  debug("InputProblem:", JSON.stringify(inputProblem, null, 2))

  // Create and run the LayoutPipelineSolver
  const solver = new LayoutPipelineSolver(inputProblem)

  debug("Starting LayoutPipelineSolver...")

  // Add initial visualization if debug is enabled
  if (debug.enabled && global.debugGraphics) {
    const initialViz = solver.visualize()
    global.debugGraphics.push({
      ...initialViz,
      title: `matchpack-initial-${group.name}`,
    })
  }

  // Solve the layout
  solver.solve()

  debug(`Solver completed in ${solver.iterations} iterations`)
  debug(`Solved: ${solver.solved}, Failed: ${solver.failed}`)

  if (solver.failed) {
    debug(`Solver failed with error: ${solver.error}`)
    throw new Error(`Matchpack layout solver failed: ${solver.error}`)
  }

  // Get the output layout
  const outputLayout = solver.getOutputLayout()
  debug("OutputLayout:", JSON.stringify(outputLayout, null, 2))

  // Add final visualization if debug is enabled
  if (debug.enabled && global.debugGraphics) {
    const finalViz = solver.visualize()
    global.debugGraphics.push({
      ...finalViz,
      title: `matchpack-final-${group.name}`,
    })
  }

  // Check for overlaps
  const overlaps = solver.checkForOverlaps(outputLayout)
  if (overlaps.length > 0) {
    debug(`Warning: Found ${overlaps.length} overlapping components:`)
    for (const overlap of overlaps) {
      debug(
        `  ${overlap.chip1} overlaps ${overlap.chip2} (area: ${overlap.overlapArea})`,
      )
    }
  }

  // Offset returned coordinates by the group's global schematic position
  const groupOffset = group._getGlobalSchematicPositionBeforeLayout()
  debug(`Group offset: x=${groupOffset.x}, y=${groupOffset.y}`)

  // Apply the layout results to schematic components
  for (const [chipId, placement] of Object.entries(
    outputLayout.chipPlacements,
  )) {
    // Find the corresponding tree node
    const treeNode = tree.childNodes.find((child) => {
      if (child.nodeType === "component" && child.sourceComponent) {
        return child.sourceComponent.name === chipId
      }
      if (child.nodeType === "group" && child.sourceGroup) {
        return child.sourceGroup.name === chipId
      }
      return false
    })

    if (!treeNode) {
      debug(`Warning: No tree node found for chip: ${chipId}`)
      continue
    }

    const newCenter = {
      x: placement.x + groupOffset.x,
      y: placement.y + groupOffset.y,
    }

    if (treeNode.nodeType === "component" && treeNode.sourceComponent) {
      const schematicComponent = db.schematic_component.getWhere({
        source_component_id: treeNode.sourceComponent.source_component_id,
      })

      if (schematicComponent) {
        debug(`Moving component ${chipId} to (${newCenter.x}, ${newCenter.y})`)

        // Get associated ports and texts
        const ports = db.schematic_port.list({
          schematic_component_id: schematicComponent.schematic_component_id,
        })
        const texts = db.schematic_text.list({
          schematic_component_id: schematicComponent.schematic_component_id,
        })

        // Calculate position delta
        const positionDelta = {
          x: newCenter.x - schematicComponent.center.x,
          y: newCenter.y - schematicComponent.center.y,
        }

        // Update port positions
        for (const port of ports) {
          port.center.x += positionDelta.x
          port.center.y += positionDelta.y
        }

        // Update text positions
        for (const text of texts) {
          text.position.x += positionDelta.x
          text.position.y += positionDelta.y
        }

        // Update component center
        schematicComponent.center = newCenter

        // TODO: Handle rotation if needed
        if (placement.ccwRotationDegrees !== 0) {
          debug(
            `Component ${chipId} has rotation: ${placement.ccwRotationDegrees}°`,
          )
          // Rotation handling would go here if supported
        }
      }
    } else if (treeNode.nodeType === "group" && treeNode.sourceGroup) {
      // Handle nested group positioning
      const schematicGroup = db.schematic_group?.getWhere?.({
        source_group_id: treeNode.sourceGroup.source_group_id,
      })

      if (schematicGroup) {
        debug(`Moving group ${chipId} to (${newCenter.x}, ${newCenter.y})`)

        // Move all elements within the group
        const groupElements = treeNode.otherChildElements || []
        const positionDelta = {
          x: newCenter.x - (schematicGroup.center?.x || 0),
          y: newCenter.y - (schematicGroup.center?.y || 0),
        }

        // Update group center if it has one
        if (schematicGroup.center) {
          schematicGroup.center = newCenter
        }

        // Move all child elements within the group
        groupElements.forEach((element: any) => {
          if (element.center) {
            element.center.x += positionDelta.x
            element.center.y += positionDelta.y
          }
          if (element.position) {
            element.position.x += positionDelta.x
            element.position.y += positionDelta.y
          }
        })
      }
    }
  }

  debug("Matchpack layout completed successfully")
}
