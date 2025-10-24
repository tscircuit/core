import {
  getCircuitJsonTree,
  type CircuitJsonTreeNode,
  type CircuitJsonUtilObjects,
} from "@tscircuit/circuit-json-util"
import { LayoutPipelineSolver, type InputProblem } from "@tscircuit/matchpack"
import Debug from "debug"
import type { Group } from "./Group"
import type { z } from "zod"
import { updateSchematicPrimitivesForLayoutShift } from "./utils/updateSchematicPrimitivesForLayoutShift"

const debug = Debug("Group_doInitialSchematicLayoutMatchpack")

// Helper function to convert facing direction to side
function facingDirectionToSide(
  facingDirection: string | undefined,
): "x-" | "x+" | "y-" | "y+" {
  switch (facingDirection) {
    case "up":
      return "y+"
    case "down":
      return "y-"
    case "left":
      return "x-"
    case "right":
      return "x+"
    default:
      return "y+"
  }
}

// Helper function to rotate a facing direction
function rotateDirection(
  direction: string,
  degrees: number,
): "up" | "right" | "down" | "left" {
  const directions: ("up" | "right" | "down" | "left")[] = [
    "right",
    "up",
    "left",
    "down",
  ]
  const currentIndex = directions.indexOf(direction as any)
  if (currentIndex === -1) return direction as "up" | "right" | "down" | "left"

  // Calculate how many 90-degree steps to rotate
  const steps = Math.round(degrees / 90)
  const newIndex = (currentIndex + steps) % 4

  return directions[newIndex < 0 ? newIndex + 4 : newIndex]
}

// Create conversion function
function convertTreeToInputProblem(
  tree: CircuitJsonTreeNode,
  db: CircuitJsonUtilObjects,
  group: Group<any>,
): InputProblem {
  const problem: InputProblem = {
    chipMap: {},
    chipPinMap: {},
    netMap: {},
    pinStrongConnMap: {},
    netConnMap: {},
    chipGap: 0.6,
    decouplingCapsGap: 0.4,
    partitionGap: 1.2,
  }

  debug(
    `[${group.name}] Processing ${tree.childNodes.length} child nodes for input problem`,
  )

  // Process each top-level child as a "composite chip"
  tree.childNodes.forEach((child, index) => {
    debug(
      `[${group.name}] Processing child ${index}: nodeType=${child.nodeType}`,
    )

    if (child.nodeType === "component") {
      debug(`[${group.name}] - Component: ${child.sourceComponent?.name}`)
    } else if (child.nodeType === "group") {
      debug(`[${group.name}] - Group: ${child.sourceGroup?.name}`)
    }
    if (child.nodeType === "component" && child.sourceComponent) {
      const chipId = child.sourceComponent.name || `chip_${index}`
      const schematicComponent = db.schematic_component.getWhere({
        source_component_id: child.sourceComponent.source_component_id,
      })

      if (!schematicComponent) return

      // Find the component instance to access its _parsedProps
      const component = group.children.find(
        (groupChild: any) =>
          groupChild.source_component_id ===
          child.sourceComponent?.source_component_id,
      )

      // Determine availableRotations based on component props
      let availableRotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270] // Default: allow all rotations

      if (component?._parsedProps?.schOrientation) {
        // If explicitly set, only allow the specified rotation, which is a
        // 0 offset (TODO in the future, we'll allow the "flipped" 180 offset)
        availableRotations = [0]
      }
      if (component?._parsedProps?.schRotation !== undefined) {
        // If explicitly set, only allow the specified rotation, which is a
        // 0 offset
        availableRotations = [0]
      }
      if (component?._parsedProps?.facingDirection) {
        // If facingDirection is set (e.g., for pinheaders), don't allow rotation
        availableRotations = [0]
      }
      if (component?._parsedProps?.schFacingDirection) {
        // If schFacingDirection is set, don't allow rotation
        availableRotations = [0]
      }

      const marginLeft =
        component?._parsedProps?.schMarginLeft ??
        component?._parsedProps?.schMarginX ??
        0
      const marginRight =
        component?._parsedProps?.schMarginRight ??
        component?._parsedProps?.schMarginX ??
        0
      let marginTop =
        component?._parsedProps?.schMarginTop ??
        component?._parsedProps?.schMarginY ??
        0
      let marginBottom =
        component?._parsedProps?.schMarginBottom ??
        component?._parsedProps?.schMarginY ??
        0

      // If component renders as a schematic box, add extra vertical margin
      if (component?.config.shouldRenderAsSchematicBox) {
        marginTop += 0.4
        marginBottom += 0.4
      }

      const marginXShift = (marginRight - marginLeft) / 2
      const marginYShift = (marginTop - marginBottom) / 2

      // Create chip entry with margins applied to size
      problem.chipMap[chipId] = {
        chipId,
        pins: [],
        size: {
          x: (schematicComponent.size?.width || 1) + marginLeft + marginRight,
          y: (schematicComponent.size?.height || 1) + marginTop + marginBottom,
        },
        availableRotations,
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
        const side = facingDirectionToSide(port.facing_direction)

        problem.chipPinMap[pinId] = {
          pinId,
          offset: {
            x:
              (port.center?.x || 0) -
              (schematicComponent.center.x || 0) +
              marginXShift,
            y:
              (port.center?.y || 0) -
              (schematicComponent.center.y || 0) +
              marginYShift,
          },
          side,
        }
      }
    } else if (child.nodeType === "group" && child.sourceGroup) {
      // Handle nested groups as composite chips
      const groupId = child.sourceGroup.name || `group_${index}`
      debug(`[${group.name}] Processing nested group: ${groupId}`)

      const schematicGroup = db.schematic_group?.getWhere?.({
        source_group_id: child.sourceGroup.source_group_id,
      })

      const groupInstance = group.children.find(
        (groupChild: any) =>
          groupChild.source_group_id === child.sourceGroup?.source_group_id,
      ) as any

      debug(
        `[${group.name}] Found schematic_group for ${groupId}:`,
        schematicGroup,
      )

      if (schematicGroup) {
        // For nested groups, we need to find their actual components and treat the group as a chip
        debug(`[${group.name}] Treating group ${groupId} as composite chip`)

        // Get all schematic components within this group
        const groupComponents = db.schematic_component.list({
          schematic_group_id: schematicGroup.schematic_group_id,
        })

        debug(
          `[${group.name}] Group ${groupId} has ${groupComponents.length} components:`,
          groupComponents.map((c: any) => c.source_component_id),
        )

        // Calculate bounding box of components in the group
        let minX = Infinity
        let maxX = -Infinity
        let minY = Infinity
        let maxY = -Infinity
        let hasValidBounds = false

        for (const comp of groupComponents) {
          if (comp.center && comp.size) {
            hasValidBounds = true
            const halfWidth = comp.size.width / 2
            const halfHeight = comp.size.height / 2
            minX = Math.min(minX, comp.center.x - halfWidth)
            maxX = Math.max(maxX, comp.center.x + halfWidth)
            minY = Math.min(minY, comp.center.y - halfHeight)
            maxY = Math.max(maxY, comp.center.y + halfHeight)
          }
        }

        const marginLeft =
          groupInstance?._parsedProps?.schMarginLeft ??
          groupInstance?._parsedProps?.schMarginX ??
          0
        const marginRight =
          groupInstance?._parsedProps?.schMarginRight ??
          groupInstance?._parsedProps?.schMarginX ??
          0
        const marginTop =
          groupInstance?._parsedProps?.schMarginTop ??
          groupInstance?._parsedProps?.schMarginY ??
          0
        const marginBottom =
          groupInstance?._parsedProps?.schMarginBottom ??
          groupInstance?._parsedProps?.schMarginY ??
          0

        const marginXShift = (marginRight - marginLeft) / 2
        const marginYShift = (marginTop - marginBottom) / 2

        const groupWidth =
          (hasValidBounds ? maxX - minX : 2) + marginLeft + marginRight
        const groupHeight =
          (hasValidBounds ? maxY - minY : 2) + marginTop + marginBottom

        debug(
          `[${group.name}] Group ${groupId} computed size: ${groupWidth} x ${groupHeight}`,
        )

        // Collect all schematic ports from components within this group
        const groupPins: string[] = []
        for (const comp of groupComponents) {
          const ports = db.schematic_port.list({
            schematic_component_id: comp.schematic_component_id,
          })

          for (const port of ports) {
            const sourcePort = db.source_port.get(port.source_port_id)
            if (!sourcePort) continue

            const pinId = `${groupId}.${sourcePort.pin_number || sourcePort.name || port.schematic_port_id}`
            groupPins.push(pinId)

            // Calculate pin offset relative to group center
            const groupCenter = schematicGroup.center || { x: 0, y: 0 }

            // Map facing direction to side
            const side = facingDirectionToSide(port.facing_direction)

            problem.chipPinMap[pinId] = {
              pinId,
              offset: {
                x: (port.center?.x || 0) - groupCenter.x + marginXShift,
                y: (port.center?.y || 0) - groupCenter.y + marginYShift,
              },
              side,
            }
          }
        }

        debug(
          `[${group.name}] Group ${groupId} has ${groupPins.length} pins:`,
          groupPins,
        )

        // Treat groups as chips with their bounding box as size and collected pins
        problem.chipMap[groupId] = {
          chipId: groupId,
          pins: groupPins,
          size: {
            x: groupWidth,
            y: groupHeight,
          },
        }

        debug(`[${group.name}] Added group ${groupId} to chipMap`)
      } else {
        debug(
          `[${group.name}] Warning: No schematic_group found for group ${groupId}`,
        )
      }
    }
  })

  // Create connections using subcircuit_connectivity_map_key
  debug(`[${group.name}] Creating connections using connectivity keys`)

  // Group pins by their connectivity keys
  const connectivityGroups = new Map<string, string[]>()

  for (const [chipId, chip] of Object.entries(problem.chipMap)) {
    for (const pinId of chip.pins) {
      // Find the source port for this pin
      const pinNumber = pinId.split(".").pop() // Extract pin number from chipId.pinNumber

      // Find the port by looking through all ports in the chip's components
      const treeNode = tree.childNodes.find((child) => {
        if (child.nodeType === "component" && child.sourceComponent) {
          return child.sourceComponent.name === chipId
        }
        if (child.nodeType === "group" && child.sourceGroup) {
          const expectedChipId = `group_${tree.childNodes.indexOf(child)}`
          return expectedChipId === chipId
        }
        return false
      })

      if (treeNode?.nodeType === "group" && treeNode.sourceGroup) {
        const schematicGroup = db.schematic_group?.getWhere?.({
          source_group_id: treeNode.sourceGroup.source_group_id,
        })

        if (schematicGroup) {
          const groupComponents = db.schematic_component.list({
            schematic_group_id: schematicGroup.schematic_group_id,
          })

          for (const comp of groupComponents) {
            const sourcePorts = db.source_port.list({
              source_component_id: comp.source_component_id,
            })

            for (const sourcePort of sourcePorts) {
              const portNumber = sourcePort.pin_number || sourcePort.name
              if (String(portNumber) === String(pinNumber)) {
                if (sourcePort.subcircuit_connectivity_map_key) {
                  const connectivityKey =
                    sourcePort.subcircuit_connectivity_map_key
                  if (!connectivityGroups.has(connectivityKey)) {
                    connectivityGroups.set(connectivityKey, [])
                  }
                  connectivityGroups.get(connectivityKey)!.push(pinId)
                  debug(
                    `[${group.name}] ✓ Pin ${pinId} has connectivity key: ${connectivityKey}`,
                  )
                } else {
                  debug(`[${group.name}] Pin ${pinId} has no connectivity key`)
                }
              }
            }
          }
        }
      } else if (
        treeNode?.nodeType === "component" &&
        treeNode.sourceComponent
      ) {
        // Handle regular component chips
        const sourcePorts = db.source_port.list({
          source_component_id: treeNode.sourceComponent.source_component_id,
        })

        for (const sourcePort of sourcePorts) {
          const portNumber = sourcePort.pin_number || sourcePort.name
          if (
            String(portNumber) === String(pinNumber) &&
            sourcePort.subcircuit_connectivity_map_key
          ) {
            const connectivityKey = sourcePort.subcircuit_connectivity_map_key
            if (!connectivityGroups.has(connectivityKey)) {
              connectivityGroups.set(connectivityKey, [])
            }
            connectivityGroups.get(connectivityKey)!.push(pinId)
            debug(
              `[${group.name}] Pin ${pinId} has connectivity key: ${connectivityKey}`,
            )
          }
        }
      }
    }
  }

  debug(
    `[${group.name}] Found ${connectivityGroups.size} connectivity groups:`,
    Array.from(connectivityGroups.entries()).map(([key, pins]) => ({
      key,
      pins,
    })),
  )

  // Create connections between pins in the same connectivity group
  for (const [connectivityKey, pins] of connectivityGroups) {
    if (pins.length >= 2) {
      // Check if this connectivity should be a strong connection or net connection
      // Strong connection: direct port-to-port (connected_source_port_ids >= 2, no nets)
      // Net connection: involves named nets (connected_source_net_ids > 0)
      const tracesWithThisKey = db.source_trace
        .list()
        .filter(
          (trace: any) =>
            trace.subcircuit_connectivity_map_key === connectivityKey,
        )

      // Check if any trace in this connectivity group involves named nets
      const hasNetConnections = tracesWithThisKey.some(
        (trace: any) =>
          trace.connected_source_net_ids &&
          trace.connected_source_net_ids.length > 0,
      )

      // Check if any trace has direct port-to-port connections
      const hasDirectConnections = tracesWithThisKey.some(
        (trace: any) =>
          trace.connected_source_port_ids &&
          trace.connected_source_port_ids.length >= 2,
      )

      debug(
        `[${group.name}] Connectivity ${connectivityKey}: hasNetConnections=${hasNetConnections}, hasDirectConnections=${hasDirectConnections}`,
      )

      // Create specific strong connections for direct port-to-port traces
      if (hasDirectConnections) {
        // Find specific pairs that have direct connections
        for (const trace of tracesWithThisKey) {
          if (
            trace.connected_source_port_ids &&
            trace.connected_source_port_ids.length >= 2
          ) {
            // This trace has direct port-to-port connections
            const directlyConnectedPins: string[] = []

            for (const portId of trace.connected_source_port_ids) {
              // Find which pin this port corresponds to
              for (const pinId of pins) {
                const pinNumber = pinId.split(".").pop()
                const sourcePort = db.source_port.get(portId)
                if (
                  sourcePort &&
                  String(sourcePort.pin_number || sourcePort.name) ===
                    String(pinNumber)
                ) {
                  // Check if this port belongs to the right component for this pin
                  const chipId = pinId.split(".")[0]
                  const treeNode = tree.childNodes.find((child) => {
                    if (
                      child.nodeType === "component" &&
                      child.sourceComponent
                    ) {
                      return child.sourceComponent.name === chipId
                    }
                    if (child.nodeType === "group" && child.sourceGroup) {
                      const expectedChipId = `group_${tree.childNodes.indexOf(child)}`
                      return expectedChipId === chipId
                    }
                    return false
                  })

                  if (
                    treeNode?.nodeType === "component" &&
                    treeNode.sourceComponent
                  ) {
                    const portBelongsToComponent = db.source_port
                      .list({
                        source_component_id:
                          treeNode.sourceComponent.source_component_id,
                      })
                      .some((p: any) => p.source_port_id === portId)

                    if (portBelongsToComponent) {
                      directlyConnectedPins.push(pinId)
                    }
                  }
                }
              }
            }

            // Create strong connections between directly connected pins
            for (let i = 0; i < directlyConnectedPins.length; i++) {
              for (let j = i + 1; j < directlyConnectedPins.length; j++) {
                const pin1 = directlyConnectedPins[i]
                const pin2 = directlyConnectedPins[j]
                problem.pinStrongConnMap[`${pin1}-${pin2}`] = true
                problem.pinStrongConnMap[`${pin2}-${pin1}`] = true
                debug(
                  `[${group.name}] Created strong connection: ${pin1} <-> ${pin2}`,
                )
              }
            }
          }
        }
      }

      // Always create net connections for the overall connectivity
      if (hasNetConnections) {
        // Determine net classification (ground, power) using source_net metadata and naming heuristics
        const source_net = db.source_net.getWhere({
          subcircuit_connectivity_map_key: connectivityKey,
        })

        const isGround = source_net?.is_ground ?? false
        const isPositiveVoltageSource = source_net?.is_power ?? false

        problem.netMap[connectivityKey] = {
          netId: connectivityKey,
          isGround,
          isPositiveVoltageSource,
        }

        // Connect all pins to this net
        for (const pinId of pins) {
          problem.netConnMap[`${pinId}-${connectivityKey}`] = true
        }

        debug(
          `[${group.name}] Created net ${connectivityKey} with ${pins.length} pins:`,
          pins,
        )
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

  debug(
    `[${group.name}] Starting matchpack layout with ${tree.childNodes.length} children`,
  )
  debug(`[${group.name}] Tree structure:`, JSON.stringify(tree, null, 2))

  if (tree.childNodes.length <= 1) {
    debug(
      `[${group.name}] Only ${tree.childNodes.length} children, skipping layout`,
    )
    return
  }

  debug("Converting circuit tree to InputProblem...")
  const inputProblem = convertTreeToInputProblem(tree, db, group)

  if (debug.enabled) {
    group.root?.emit("debug:logOutput", {
      type: "debug:logOutput",
      name: `matchpack-input-problem-${group.name}`,
      content: JSON.stringify(inputProblem, null, 2),
    })
  }

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

  // Check if solver completed successfully
  debug("Solver completed successfully:", !solver.failed)

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
  debug(
    `Applying layout results for ${Object.keys(outputLayout.chipPlacements).length} chip placements`,
  )

  for (const [chipId, placement] of Object.entries(
    outputLayout.chipPlacements,
  )) {
    debug(
      `Processing placement for chip: ${chipId} at (${placement.x}, ${placement.y})`,
    )

    // Find the corresponding tree node
    const treeNode = tree.childNodes.find((child) => {
      if (child.nodeType === "component" && child.sourceComponent) {
        const matches = child.sourceComponent.name === chipId
        debug(
          `  Checking component ${child.sourceComponent.name}: matches=${matches}`,
        )
        return matches
      }
      if (child.nodeType === "group" && child.sourceGroup) {
        // For groups, we created chipId as "group_N" where N is the index
        const groupName = child.sourceGroup.name
        const expectedChipId = `group_${tree.childNodes.indexOf(child)}`
        const matches = expectedChipId === chipId
        debug(
          `  Checking group ${groupName} (expected chipId: ${expectedChipId}): matches=${matches}`,
        )
        return matches
      }
      return false
    })

    if (!treeNode) {
      debug(`Warning: No tree node found for chip: ${chipId}`)
      debug(
        "Available tree nodes:",
        tree.childNodes.map((child, idx) => ({
          type: child.nodeType,
          name:
            child.nodeType === "component"
              ? child.sourceComponent?.name
              : child.sourceGroup?.name,
          expectedChipId:
            child.nodeType === "group"
              ? `group_${idx}`
              : child.sourceComponent?.name,
        })),
      )
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

        // Update schematic primitives (rects, lines, circles, arcs)
        updateSchematicPrimitivesForLayoutShift({
          db,
          schematicComponentId: schematicComponent.schematic_component_id,
          deltaX: positionDelta.x,
          deltaY: positionDelta.y,
        })

        // Update component center
        schematicComponent.center = newCenter

        // Handle rotation if needed
        if (placement.ccwRotationDegrees !== 0) {
          debug(
            `Component ${chipId} has rotation: ${placement.ccwRotationDegrees}°`,
          )

          // Rotate component size for 90° and 270° rotations
          if (
            placement.ccwRotationDegrees === 90 ||
            placement.ccwRotationDegrees === 270
          ) {
            if (schematicComponent.size) {
              const oldWidth = schematicComponent.size.width
              const oldHeight = schematicComponent.size.height
              schematicComponent.size.width = oldHeight
              schematicComponent.size.height = oldWidth
            }
          }
          
          // Rotate ports around the component center
          const angleRad = (placement.ccwRotationDegrees * Math.PI) / 180
          const cos = Math.cos(angleRad)
          const sin = Math.sin(angleRad)

          for (const port of ports) {
            // Get original offset from center
            const dx = port.center.x - newCenter.x
            const dy = port.center.y - newCenter.y

            // Apply rotation matrix
            const rotatedDx = dx * cos - dy * sin
            const rotatedDy = dx * sin + dy * cos

            // Update port position
            port.center.x = newCenter.x + rotatedDx
            port.center.y = newCenter.y + rotatedDy

            // Update port facing direction based on rotation
            const originalDirection = port.facing_direction || "right"
            port.facing_direction = rotateDirection(
              originalDirection,
              placement.ccwRotationDegrees,
            )
            port.side_of_component =
              (port.facing_direction === "up"
                ? "top"
                : port.facing_direction === "down"
                  ? "bottom"
                  : (port.facing_direction as
                      | "left"
                      | "right"
                      | "top"
                      | "bottom")) || port.side_of_component
          }

          // Also rotate text positions
          for (const text of texts) {
            const dx = text.position.x - newCenter.x
            const dy = text.position.y - newCenter.y

            const rotatedDx = dx * cos - dy * sin
            const rotatedDy = dx * sin + dy * cos

            text.position.x = newCenter.x + rotatedDx
            text.position.y = newCenter.y + rotatedDy
          }

          // Apply rotation to component direction
          if (schematicComponent.symbol_name) {
            const schematicSymbolDirection =
              schematicComponent.symbol_name.match(/_(right|left|up|down)$/)
            if (schematicSymbolDirection) {
              schematicComponent.symbol_name =
                schematicComponent.symbol_name.replace(
                  schematicSymbolDirection[0],
                  `_${rotateDirection(schematicSymbolDirection[1], placement.ccwRotationDegrees)}`,
                )
            }
          }
        }
      }
    } else if (treeNode.nodeType === "group" && treeNode.sourceGroup) {
      // Handle nested group positioning
      const schematicGroup = db.schematic_group?.getWhere?.({
        source_group_id: treeNode.sourceGroup.source_group_id,
      })

      if (schematicGroup) {
        debug(
          `Moving group ${chipId} to (${newCenter.x}, ${newCenter.y}) from (${schematicGroup.center?.x}, ${schematicGroup.center?.y})`,
        )

        // Get all schematic components within this group
        const groupComponents = db.schematic_component.list({
          schematic_group_id: schematicGroup.schematic_group_id,
        })

        debug(
          `Group ${chipId} has ${groupComponents.length} components to move`,
        )

        // Calculate position delta
        const oldCenter = schematicGroup.center || { x: 0, y: 0 }
        const positionDelta = {
          x: newCenter.x - oldCenter.x,
          y: newCenter.y - oldCenter.y,
        }

        debug(
          `Position delta for group ${chipId}: (${positionDelta.x}, ${positionDelta.y})`,
        )

        // Move all components within the group
        for (const component of groupComponents) {
          if (component.center) {
            const oldComponentCenter = { ...component.center }
            component.center.x += positionDelta.x
            component.center.y += positionDelta.y

            debug(
              `Moved component ${component.source_component_id} from (${oldComponentCenter.x}, ${oldComponentCenter.y}) to (${component.center.x}, ${component.center.y})`,
            )

            // Update associated ports and texts
            const ports = db.schematic_port.list({
              schematic_component_id: component.schematic_component_id,
            })
            const texts = db.schematic_text.list({
              schematic_component_id: component.schematic_component_id,
            })

            // Update port positions
            for (const port of ports) {
              if (port.center) {
                port.center.x += positionDelta.x
                port.center.y += positionDelta.y
              }
            }

            // Update text positions
            for (const text of texts) {
              if (text.position) {
                text.position.x += positionDelta.x
                text.position.y += positionDelta.y
              }
            }
          }
        }

        // Update the group center
        schematicGroup.center = newCenter
        debug(
          `Updated group ${chipId} center to (${newCenter.x}, ${newCenter.y})`,
        )
      }
    }
  }

  debug("Matchpack layout completed successfully")
}
