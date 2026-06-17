import {
  type CircuitJsonTreeNode,
  type CircuitJsonUtilObjects,
} from "@tscircuit/circuit-json-util"
import { type InputProblem, LayoutPipelineSolver } from "@tscircuit/matchpack"
import Debug from "debug"
import type { z } from "zod"
import type { Group } from "./Group"
import { updateSchematicPrimitivesForLayoutShift } from "./utils/updateSchematicPrimitivesForLayoutShift"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { getBoundFromCenteredRect } from "@tscircuit/math-utils"

const debug = Debug("Group_doInitialSchematicLayoutMatchpack")

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

  const steps = Math.round(degrees / 90)
  const newIndex = (currentIndex + steps) % 4

  return directions[newIndex < 0 ? newIndex + 4 : newIndex]
}

function isTreeChildExplicitlyPositioned(
  treeChild: CircuitJsonTreeNode,
  group: Group,
): boolean {
  if (treeChild.nodeType === "component" && treeChild.sourceComponent) {
    const component = group.children.find(
      (groupChild) =>
        groupChild.source_component_id ===
        treeChild.sourceComponent?.source_component_id,
    )
    return (
      component?._parsedProps?.schX !== undefined ||
      component?._parsedProps?.schY !== undefined
    )
  }

  if (treeChild.nodeType === "group" && treeChild.sourceGroup) {
    const nestedGroup = group.children.find(
      (groupChild) =>
        groupChild.source_group_id === treeChild.sourceGroup?.source_group_id,
    )
    return (
      nestedGroup?._parsedProps?.schX !== undefined ||
      nestedGroup?._parsedProps?.schY !== undefined
    )
  }

  return false
}

function getTreeChildChipId(
  child: CircuitJsonTreeNode,
  index: number,
): string | null {
  if (child.nodeType === "component" && child.sourceComponent) {
    return child.sourceComponent.name || `chip_${index}`
  }
  if (child.nodeType === "group" && child.sourceGroup) {
    return child.sourceGroup.name || `group_${index}`
  }
  return null
}

function convertTreeToMatchPackInputProblem(
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

  const groupOffset = group._getGlobalSchematicPositionBeforeLayout()

  debug(
    `[${group.name}] Processing ${tree.childNodes.length} child nodes for input problem`,
  )

  tree.childNodes.forEach((child, index) => {
    const explicitlyPositioned = isTreeChildExplicitlyPositioned(child, group)

    if (explicitlyPositioned) {
      debug(
        `[${group.name}] Child ${index} explicitly positioned, including as fixed chip`,
      )
    } else {
      debug(
        `[${group.name}] Processing child ${index}: nodeType=${child.nodeType}`,
      )
    }

    if (child.nodeType === "component") {
      debug(`[${group.name}] - Component: ${child.sourceComponent?.name}`)
    } else if (child.nodeType === "group") {
      debug(`[${group.name}] - Group: ${child.sourceGroup?.name}`)
    }
    if (child.nodeType === "component" && child.sourceComponent) {
      const chipId = getTreeChildChipId(child, index)!
      const schematicComponent = db.schematic_component.getWhere({
        source_component_id: child.sourceComponent.source_component_id,
      })

      if (!schematicComponent) return

      const component = group.children.find(
        (groupChild: any) =>
          groupChild.source_component_id ===
          child.sourceComponent?.source_component_id,
      )

      let availableRotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270]

      if (component?._parsedProps?.schOrientation) {
        availableRotations = [0]
      }
      if (component?._parsedProps?.schRotation !== undefined) {
        availableRotations = [0]
      }
      if (component?._parsedProps?.facingDirection) {
        availableRotations = [0]
      }
      if (component?._parsedProps?.schFacingDirection) {
        availableRotations = [0]
      }
      if (component?.componentName === "Chip") {
        availableRotations = [0]
      }

      const componentWithTextBounds = getSchematicComponentWithTextBounds(
        db,
        schematicComponent,
      )
      let textPadLeft = 0
      let textPadRight = 0
      let textPadTop = 0
      let textPadBottom = 0
      if (componentWithTextBounds && schematicComponent.center) {
        const halfWidth = (schematicComponent.size?.width ?? 0) / 2
        const halfHeight = (schematicComponent.size?.height ?? 0) / 2
        textPadLeft =
          schematicComponent.center.x - halfWidth - componentWithTextBounds.minX
        textPadRight =
          componentWithTextBounds.maxX -
          (schematicComponent.center.x + halfWidth)
        textPadTop =
          componentWithTextBounds.maxY -
          (schematicComponent.center.y + halfHeight)
        textPadBottom =
          schematicComponent.center.y -
          halfHeight -
          componentWithTextBounds.minY
      }

      const marginLeft =
        (component?._parsedProps?.schMarginLeft ??
          component?._parsedProps?.schMarginX ??
          0) + textPadLeft
      const marginRight =
        (component?._parsedProps?.schMarginRight ??
          component?._parsedProps?.schMarginX ??
          0) + textPadRight
      let marginTop =
        (component?._parsedProps?.schMarginTop ??
          component?._parsedProps?.schMarginY ??
          0) + textPadTop
      let marginBottom =
        (component?._parsedProps?.schMarginBottom ??
          component?._parsedProps?.schMarginY ??
          0) + textPadBottom

      if (component?.config.shouldRenderAsSchematicBox) {
        marginTop += 0.4
        marginBottom += 0.4
      }

      const marginXShift = (marginRight - marginLeft) / 2
      const marginYShift = (marginTop - marginBottom) / 2

      problem.chipMap[chipId] = {
        chipId,
        pins: [],
        size: {
          x: (schematicComponent.size?.width || 1) + marginLeft + marginRight,
          y: (schematicComponent.size?.height || 1) + marginTop + marginBottom,
        },
        availableRotations,
        ...(explicitlyPositioned && {
          fixedPosition: {
            x: schematicComponent.center.x - groupOffset.x,
            y: schematicComponent.center.y - groupOffset.y,
          },
        }),
      }

      const ports = db.schematic_port.list({
        schematic_component_id: schematicComponent.schematic_component_id,
      })

      for (const port of ports) {
        const sourcePort = db.source_port.get(port.source_port_id)
        if (!sourcePort) continue

        const pinId = `${chipId}.${sourcePort.pin_number || sourcePort.name || port.schematic_port_id}`
        problem.chipMap[chipId].pins.push(pinId)

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
      const groupId = getTreeChildChipId(child, index)!
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
        debug(`[${group.name}] Treating group ${groupId} as composite chip`)

        const groupComponents = db.schematic_component.list({
          schematic_group_id: schematicGroup.schematic_group_id,
        })

        debug(
          `[${group.name}] Group ${groupId} has ${groupComponents.length} components:`,
          groupComponents.map((c: any) => c.source_component_id),
        )

        let minX = Infinity
        let maxX = -Infinity
        let minY = Infinity
        let maxY = -Infinity
        let hasValidBounds = false

        for (const comp of groupComponents) {
          if (comp.center && comp.size) {
            hasValidBounds = true
            const compBounds =
              getSchematicComponentWithTextBounds(db, comp) ??
              getBoundFromCenteredRect({
                center: comp.center,
                width: comp.size.width,
                height: comp.size.height,
              })
            minX = Math.min(minX, compBounds.minX)
            maxX = Math.max(maxX, compBounds.maxX)
            minY = Math.min(minY, compBounds.minY)
            maxY = Math.max(maxY, compBounds.maxY)
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

            const groupCenter = schematicGroup.center || { x: 0, y: 0 }
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

  debug(`[${group.name}] Creating connections using connectivity keys`)

  const connectivityGroups = new Map<string, string[]>()

  for (const [chipId, chip] of Object.entries(problem.chipMap)) {
    for (const pinId of chip.pins) {
      const pinNumber = pinId.split(".").pop()

      const treeNode = tree.childNodes.find((child) => {
        return (
          getTreeChildChipId(child, tree.childNodes.indexOf(child)) === chipId
        )
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

  for (const [connectivityKey, pins] of connectivityGroups) {
    if (pins.length >= 2) {
      const tracesWithThisKey = db.source_trace
        .list()
        .filter(
          (trace: any) =>
            trace.subcircuit_connectivity_map_key === connectivityKey,
        )

      const hasNetConnections = tracesWithThisKey.some(
        (trace: any) =>
          trace.connected_source_net_ids &&
          trace.connected_source_net_ids.length > 0,
      )

      const hasDirectConnections = tracesWithThisKey.some(
        (trace: any) =>
          trace.connected_source_port_ids &&
          trace.connected_source_port_ids.length >= 2,
      )

      debug(
        `[${group.name}] Connectivity ${connectivityKey}: hasNetConnections=${hasNetConnections}, hasDirectConnections=${hasDirectConnections}`,
      )

      if (hasDirectConnections) {
        for (const trace of tracesWithThisKey) {
          if (
            trace.connected_source_port_ids &&
            trace.connected_source_port_ids.length >= 2
          ) {
            const directlyConnectedPins: string[] = []

            for (const portId of trace.connected_source_port_ids) {
              for (const pinId of pins) {
                const pinNumber = pinId.split(".").pop()
                const sourcePort = db.source_port.get(portId)
                if (
                  sourcePort &&
                  String(sourcePort.pin_number || sourcePort.name) ===
                    String(pinNumber)
                ) {
                  const chipId = pinId.split(".")[0]
                  const treeNode = tree.childNodes.find((child) => {
                    return (
                      getTreeChildChipId(
                        child,
                        tree.childNodes.indexOf(child),
                      ) === chipId
                    )
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

      if (hasNetConnections) {
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

export function applySchematicMatchPackLayoutToTree<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>, tree: CircuitJsonTreeNode): void {
  const { db } = group.root!

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
  const inputProblem = convertTreeToMatchPackInputProblem(tree, db, group)

  if (debug.enabled) {
    group.root?.emit("debug:logOutput", {
      type: "debug:logOutput",
      name: `matchpack-input-problem-${group.name}`,
      content: JSON.stringify(inputProblem, null, 2),
    })
  }

  const solver = new LayoutPipelineSolver(inputProblem)

  debug("Starting LayoutPipelineSolver...")

  if (debug.enabled && global?.debugGraphics) {
    const initialViz = solver.visualize()
    global.debugGraphics.push({
      ...initialViz,
      title: `matchpack-initial-${group.name}`,
    })
  }

  solver.solve()

  debug(`Solver completed in ${solver.iterations} iterations`)
  debug(`Solved: ${solver.solved}, Failed: ${solver.failed}`)

  if (solver.failed) {
    debug(`Solver failed with error: ${solver.error}`)
    throw new Error(`Matchpack layout solver failed: ${solver.error}`)
  }

  const outputLayout = solver.getOutputLayout()
  debug("OutputLayout:", JSON.stringify(outputLayout, null, 2))

  debug("Solver completed successfully:", !solver.failed)

  if (debug.enabled && global?.debugGraphics) {
    const finalViz = solver.visualize()
    global.debugGraphics.push({
      ...finalViz,
      title: `matchpack-final-${group.name}`,
    })
  }

  const overlaps = solver.checkForOverlaps(outputLayout)
  if (overlaps.length > 0) {
    debug(`Warning: Found ${overlaps.length} overlapping components:`)
    for (const overlap of overlaps) {
      debug(
        `  ${overlap.chip1} overlaps ${overlap.chip2} (area: ${overlap.overlapArea})`,
      )
    }
  }

  const groupOffset = group._getGlobalSchematicPositionBeforeLayout()
  debug(`Group offset: x=${groupOffset.x}, y=${groupOffset.y}`)

  debug(
    `Applying layout results for ${Object.keys(outputLayout.chipPlacements).length} chip placements`,
  )

  for (const [chipId, placement] of Object.entries(
    outputLayout.chipPlacements,
  )) {
    debug(
      `Processing placement for chip: ${chipId} at (${placement.x}, ${placement.y})`,
    )

    const treeNode = tree.childNodes.find((child) => {
      const expectedChipId = getTreeChildChipId(
        child,
        tree.childNodes.indexOf(child),
      )
      const matches = expectedChipId === chipId
      debug(`  Checking child ${expectedChipId}: matches=${matches}`)
      return matches
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
          expectedChipId: getTreeChildChipId(child, idx),
        })),
      )
      continue
    }

    const newCenter = {
      x: placement.x + groupOffset.x,
      y: placement.y + groupOffset.y,
    }

    if (treeNode.nodeType === "component" && treeNode.sourceComponent) {
      const groupChild = group.children.find(
        (c: any) =>
          c.source_component_id ===
          treeNode.sourceComponent?.source_component_id,
      ) as any
      if (
        groupChild?._parsedProps?.schX !== undefined ||
        groupChild?._parsedProps?.schY !== undefined
      ) {
        debug(`Skipping position update for fixed chip ${chipId}`)
        continue
      }

      const schematicComponent = db.schematic_component.getWhere({
        source_component_id: treeNode.sourceComponent.source_component_id,
      })

      if (schematicComponent) {
        debug(`Moving component ${chipId} to (${newCenter.x}, ${newCenter.y})`)

        const ports = db.schematic_port.list({
          schematic_component_id: schematicComponent.schematic_component_id,
        })
        const texts = db.schematic_text.list({
          schematic_component_id: schematicComponent.schematic_component_id,
        })

        const positionDelta = {
          x: newCenter.x - schematicComponent.center.x,
          y: newCenter.y - schematicComponent.center.y,
        }

        for (const port of ports) {
          port.center.x += positionDelta.x
          port.center.y += positionDelta.y
        }

        for (const text of texts) {
          text.position.x += positionDelta.x
          text.position.y += positionDelta.y
        }

        updateSchematicPrimitivesForLayoutShift({
          db,
          schematicComponentId: schematicComponent.schematic_component_id,
          deltaX: positionDelta.x,
          deltaY: positionDelta.y,
        })

        schematicComponent.center = newCenter

        if (placement.ccwRotationDegrees !== 0) {
          debug(
            `Component ${chipId} has rotation: ${placement.ccwRotationDegrees}°`,
          )

          const normalizedRotation =
            ((Math.round(placement.ccwRotationDegrees) % 360) + 360) % 360
          if (
            (normalizedRotation === 90 || normalizedRotation === 270) &&
            schematicComponent.size
          ) {
            const prevWidth = schematicComponent.size.width
            schematicComponent.size.width = schematicComponent.size.height
            schematicComponent.size.height = prevWidth
          }

          const angleRad = (placement.ccwRotationDegrees * Math.PI) / 180
          const cos = Math.cos(angleRad)
          const sin = Math.sin(angleRad)

          for (const port of ports) {
            const dx = port.center.x - newCenter.x
            const dy = port.center.y - newCenter.y

            const rotatedDx = dx * cos - dy * sin
            const rotatedDy = dx * sin + dy * cos

            port.center.x = newCenter.x + rotatedDx
            port.center.y = newCenter.y + rotatedDy

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

          for (const text of texts) {
            const dx = text.position.x - newCenter.x
            const dy = text.position.y - newCenter.y

            const rotatedDx = dx * cos - dy * sin
            const rotatedDy = dx * sin + dy * cos

            text.position.x = newCenter.x + rotatedDx
            text.position.y = newCenter.y + rotatedDy
          }

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

            const schematicSymbolOrientation =
              schematicComponent.symbol_name.match(/_(horz|vert)$/)
            if (schematicSymbolOrientation) {
              const normalizedRot =
                ((placement.ccwRotationDegrees % 360) + 360) % 360
              const shouldSwapOrientation =
                normalizedRot === 90 || normalizedRot === 270

              if (shouldSwapOrientation) {
                schematicComponent.symbol_name =
                  schematicComponent.symbol_name.replace(
                    schematicSymbolOrientation[0],
                    schematicSymbolOrientation[1] === "horz"
                      ? "_vert"
                      : "_horz",
                  )
              }
            }
          }
        }
      }
    } else if (treeNode.nodeType === "group" && treeNode.sourceGroup) {
      const schematicGroup = db.schematic_group?.getWhere?.({
        source_group_id: treeNode.sourceGroup.source_group_id,
      })

      if (schematicGroup) {
        debug(
          `Moving group ${chipId} to (${newCenter.x}, ${newCenter.y}) from (${schematicGroup.center?.x}, ${schematicGroup.center?.y})`,
        )

        const groupComponents = db.schematic_component.list({
          schematic_group_id: schematicGroup.schematic_group_id,
        })

        debug(
          `Group ${chipId} has ${groupComponents.length} components to move`,
        )

        const oldCenter = schematicGroup.center || { x: 0, y: 0 }
        const positionDelta = {
          x: newCenter.x - oldCenter.x,
          y: newCenter.y - oldCenter.y,
        }

        debug(
          `Position delta for group ${chipId}: (${positionDelta.x}, ${positionDelta.y})`,
        )

        for (const component of groupComponents) {
          if (component.center) {
            const oldComponentCenter = { ...component.center }
            component.center.x += positionDelta.x
            component.center.y += positionDelta.y

            debug(
              `Moved component ${component.source_component_id} from (${oldComponentCenter.x}, ${oldComponentCenter.y}) to (${component.center.x}, ${component.center.y})`,
            )

            const ports = db.schematic_port.list({
              schematic_component_id: component.schematic_component_id,
            })
            const texts = db.schematic_text.list({
              schematic_component_id: component.schematic_component_id,
            })

            for (const port of ports) {
              if (port.center) {
                port.center.x += positionDelta.x
                port.center.y += positionDelta.y
              }
            }

            for (const text of texts) {
              if (text.position) {
                text.position.x += positionDelta.x
                text.position.y += positionDelta.y
              }
            }
          }
        }

        schematicGroup.center = newCenter
        debug(
          `Updated group ${chipId} center to (${newCenter.x}, ${newCenter.y})`,
        )
      }
    }
  }

  debug("Matchpack layout completed successfully")
}
