import type { SchematicPort } from "circuit-json"
import {
  getSchematicComponentWithTextBounds,
  getSchematicTextBounds,
} from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { Port } from "../../Port"
import type { Subcircuit } from "./Subcircuit"

type FacingDirection = NonNullable<SchematicPort["facing_direction"]>

/**
 * Place public terminals around a standalone subcircuit after internal layout.
 * All positions are schematic-world points in mm, +X right and +Y up (the XY
 * plane of the right-handed circuit frame), including group translation.
 * facing_direction is an outward direction; routing approaches from inside.
 */
export function Subcircuit_doInitialSchematicGroupPortLayout(
  subcircuit: Subcircuit,
) {
  const root = subcircuit.root
  if (
    !root?.isRootCircuit ||
    root.children.length !== 1 ||
    root.children[0] !== subcircuit ||
    root.schematicDisabled
  )
    return
  if (subcircuit._parsedProps.showAsSchematicBox) return
  const ports = subcircuit.children.filter(
    (child): child is Port => child instanceof Port,
  )
  if (ports.length === 0) return
  const { db } = root
  // A schematic group has one coordinate frame. Multi-sheet root interfaces
  // need a sheet-specific public interface declaration; do not mix their frames.
  const schematicSheetIds = new Set(
    db.schematic_component
      .list()
      .map((component) => component.schematic_sheet_id),
  )
  if (schematicSheetIds.size > 1) return
  const schematicSheetId = [...schematicSheetIds][0]

  const sides: Record<FacingDirection, Port[]> = {
    left: [],
    right: [],
    up: [],
    down: [],
  }
  const arrangement = subcircuit._getSchematicPortArrangement()
  const arrangedPorts = new Set<Port>()
  for (const [side, direction] of [
    ["leftSide", "left"],
    ["rightSide", "right"],
    ["topSide", "up"],
    ["bottomSide", "down"],
  ] as const) {
    const sideArrangement = arrangement?.[side]
    if (!sideArrangement || !("pins" in sideArrangement)) continue
    const sidePorts = sideArrangement.pins.flatMap((pin) => {
      const port = ports.find((port) =>
        port.isMatchingAnyOf([String(pin), `pin${pin}`]),
      )
      if (!port || arrangedPorts.has(port)) return []
      arrangedPorts.add(port)
      return [port]
    })
    if (
      sideArrangement.direction === "bottom-to-top" ||
      sideArrangement.direction === "right-to-left"
    )
      sidePorts.reverse()
    sides[direction].push(...sidePorts)
  }
  for (const port of ports) {
    if (!arrangedPorts.has(port))
      sides[port._parsedProps.direction ?? "left"].push(port)
  }

  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  }
  const include = (x: number, y: number) => {
    bounds.minX = Math.min(bounds.minX, x)
    bounds.maxX = Math.max(bounds.maxX, x)
    bounds.minY = Math.min(bounds.minY, y)
    bounds.maxY = Math.max(bounds.maxY, y)
  }
  for (const schematicComponent of db.schematic_component.list()) {
    const componentBounds = getSchematicComponentWithTextBounds({
      db,
      schematicComponent,
    }) ?? {
      minX: schematicComponent.center.x - schematicComponent.size.width / 2,
      maxX: schematicComponent.center.x + schematicComponent.size.width / 2,
      minY: schematicComponent.center.y - schematicComponent.size.height / 2,
      maxY: schematicComponent.center.y + schematicComponent.size.height / 2,
    }
    include(componentBounds.minX, componentBounds.minY)
    include(componentBounds.maxX, componentBounds.maxY)
  }
  for (const schematicPort of db.schematic_port.list())
    include(schematicPort.center.x, schematicPort.center.y)
  for (const text of db.schematic_text.list()) {
    const textBounds = getSchematicTextBounds({
      text: text.text,
      position: text.position,
      anchor: text.anchor,
      fontSize: text.font_size,
    })
    include(textBounds.minX, textBounds.minY)
    include(textBounds.maxX, textBounds.maxY)
  }
  if (!Number.isFinite(bounds.minX)) {
    const origin = subcircuit._getGlobalSchematicPositionBeforeLayout()
    include(origin.x, origin.y)
  }
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  }
  const horizontalPitch = Math.max(
    0.8,
    ...[...sides.up, ...sides.down].map(
      (port) => (port.name?.length ?? 0) * 0.12 + 0.4,
    ),
  )
  const width = Math.max(
    4,
    bounds.maxX - bounds.minX + 4,
    (Math.max(sides.up.length, sides.down.length) + 1) * horizontalPitch,
    subcircuit._parsedProps.schWidth ?? 0,
  )
  const height = Math.max(
    4,
    bounds.maxY - bounds.minY + 4,
    (Math.max(sides.left.length, sides.right.length) + 1) * 0.8,
    subcircuit._parsedProps.schHeight ?? 0,
  )
  db.schematic_group.update(subcircuit.schematic_group_id!, {
    center,
    width,
    height,
    show_boundary: true,
    schematic_sheet_id: schematicSheetId,
    schematic_component_ids: db.schematic_component
      .list()
      .map((component) => component.schematic_component_id),
  })
  for (const direction of ["left", "right", "up", "down"] as const) {
    const sidePorts = sides[direction]
    for (const [index, port] of sidePorts.entries()) {
      const vertical = direction === "left" || direction === "right"
      const offset =
        (index - (sidePorts.length - 1) / 2) *
        (vertical ? 0.8 : horizontalPitch)
      const boundaryPosition = {
        x: vertical
          ? center.x + (direction === "left" ? -width / 2 : width / 2)
          : center.x + offset,
        y: vertical
          ? center.y - offset
          : center.y + (direction === "up" ? height / 2 : -height / 2),
      }
      const terminal = {
        x:
          boundaryPosition.x +
          (direction === "left" ? -0.4 : direction === "right" ? 0.4 : 0),
        y:
          boundaryPosition.y +
          (direction === "up" ? 0.4 : direction === "down" ? -0.4 : 0),
      }
      if (port.schematic_port_id)
        db.schematic_port.delete(port.schematic_port_id)
      const schematicPort = db.schematic_port.insert({
        source_port_id: port.source_port_id!,
        schematic_group_id: subcircuit.schematic_group_id!,
        schematic_sheet_id: schematicSheetId,
        center: terminal,
        boundary_position: boundaryPosition,
        facing_direction: direction,
        display_pin_label: port.name,
        is_connected: false,
      })
      port.schematic_port_id = schematicPort.schematic_port_id
    }
  }
}
