import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type {
  Point,
  SchematicComponent,
  SchematicPort,
  Size,
} from "circuit-json"
import { updateSchematicPrimitivesForLayoutShift } from "lib/components/primitive-components/Group/utils/updateSchematicPrimitivesForLayoutShift"
import type { Ammeter } from "./Ammeter"

type Rect = {
  left: number
  right: number
  top: number
  bottom: number
}

const PLACEMENT_MARGIN = 0.25

const rectForComponent = (
  component: SchematicComponent,
  margin: number,
): Rect => ({
  left: component.center.x - component.size.width / 2 - margin,
  right: component.center.x + component.size.width / 2 + margin,
  bottom: component.center.y - component.size.height / 2 - margin,
  top: component.center.y + component.size.height / 2 + margin,
})

const rectsOverlap = (a: Rect, b: Rect) =>
  a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom

const getCandidateCenters = ({
  baseCenter,
  size,
}: {
  baseCenter: Point
  size: Size
}) => {
  const xStep = size.width + PLACEMENT_MARGIN * 2
  const yStep = size.height + PLACEMENT_MARGIN * 2

  return [
    baseCenter,
    { x: baseCenter.x, y: baseCenter.y + yStep },
    { x: baseCenter.x, y: baseCenter.y - yStep },
    { x: baseCenter.x + xStep, y: baseCenter.y },
    { x: baseCenter.x - xStep, y: baseCenter.y },
    { x: baseCenter.x + xStep, y: baseCenter.y + yStep },
    { x: baseCenter.x - xStep, y: baseCenter.y + yStep },
    { x: baseCenter.x + xStep, y: baseCenter.y - yStep },
    { x: baseCenter.x - xStep, y: baseCenter.y - yStep },
    { x: baseCenter.x, y: baseCenter.y + yStep * 2 },
    { x: baseCenter.x, y: baseCenter.y - yStep * 2 },
  ]
}

const getConnectedSchematicPort = ({
  ammeterSourcePortId,
  schematicPorts,
  sourceTraces,
}: {
  ammeterSourcePortId: string
  schematicPorts: SchematicPort[]
  sourceTraces: Array<{ connected_source_port_ids: string[] }>
}) => {
  for (const sourceTrace of sourceTraces) {
    if (!sourceTrace.connected_source_port_ids.includes(ammeterSourcePortId)) {
      continue
    }

    const connectedSourcePortId = sourceTrace.connected_source_port_ids.find(
      (sourcePortId) => sourcePortId !== ammeterSourcePortId,
    )
    if (connectedSourcePortId === undefined) continue

    const schematicPort = schematicPorts.find(
      (port) => port.source_port_id === connectedSourcePortId,
    )
    if (schematicPort) return schematicPort
  }

  return null
}

const midpoint = (ports: SchematicPort[]): Point => ({
  x: ports.reduce((sum, port) => sum + port.center.x, 0) / ports.length,
  y: ports.reduce((sum, port) => sum + port.center.y, 0) / ports.length,
})

const shiftAmmeterSchematicElements = ({
  ammeter,
  db,
  oldCenter,
  newCenter,
}: {
  ammeter: Ammeter
  db: CircuitJsonUtilObjects
  oldCenter: Point
  newCenter: Point
}) => {
  const schematicComponentId = ammeter.schematic_component_id
  if (!schematicComponentId) return

  const deltaX = newCenter.x - oldCenter.x
  const deltaY = newCenter.y - oldCenter.y
  if (deltaX === 0 && deltaY === 0) return

  db.schematic_component.update(schematicComponentId, {
    center: newCenter,
  })

  for (const port of db.schematic_port.list({
    schematic_component_id: schematicComponentId,
  })) {
    db.schematic_port.update(port.schematic_port_id, {
      center: {
        x: port.center.x + deltaX,
        y: port.center.y + deltaY,
      },
    })
  }

  for (const text of db.schematic_text.list({
    schematic_component_id: schematicComponentId,
  })) {
    db.schematic_text.update(text.schematic_text_id, {
      position: {
        x: text.position.x + deltaX,
        y: text.position.y + deltaY,
      },
    })
  }

  updateSchematicPrimitivesForLayoutShift({
    db,
    schematicComponentId,
    deltaX,
    deltaY,
  })
}

export const Ammeter_doInitialSchematicLayout = (ammeter: Ammeter) => {
  const { root } = ammeter
  if (!root || root.schematicDisabled) return
  if (!ammeter.schematic_component_id) return
  if (
    ammeter._parsedProps.schX !== undefined ||
    ammeter._parsedProps.schY !== undefined
  ) {
    return
  }
  if (ammeter.getGroup()?._getSchematicLayoutMode() !== "relative") return

  const { db } = root
  const schematicComponent = db.schematic_component.get(
    ammeter.schematic_component_id,
  )
  if (!schematicComponent) return

  const ammeterSourcePortIds = [
    ammeter.portMap.pos.source_port_id,
    ammeter.portMap.neg.source_port_id,
  ].filter(
    (sourcePortId): sourcePortId is string => typeof sourcePortId === "string",
  )
  if (ammeterSourcePortIds.length === 0) return

  const schematicPorts = db.schematic_port.list()
  const sourceTraces = db.source_trace.list()
  const connectedSchematicPorts = ammeterSourcePortIds
    .map((ammeterSourcePortId) =>
      getConnectedSchematicPort({
        ammeterSourcePortId,
        schematicPorts,
        sourceTraces,
      }),
    )
    .filter((port): port is SchematicPort => port !== null)
  if (connectedSchematicPorts.length === 0) return

  const baseCenter = midpoint(connectedSchematicPorts)
  const obstacles = db.schematic_component
    .list()
    .filter(
      (component) =>
        component.schematic_component_id !==
          schematicComponent.schematic_component_id &&
        !component.is_schematic_group &&
        component.schematic_sheet_id === schematicComponent.schematic_sheet_id,
    )
    .map((component) => rectForComponent(component, PLACEMENT_MARGIN))

  const bestCenter =
    getCandidateCenters({
      baseCenter,
      size: schematicComponent.size,
    }).find((candidateCenter) => {
      const candidateRect = rectForComponent(
        { ...schematicComponent, center: candidateCenter },
        PLACEMENT_MARGIN,
      )
      return !obstacles.some((obstacle) =>
        rectsOverlap(candidateRect, obstacle),
      )
    }) ?? baseCenter

  shiftAmmeterSchematicElements({
    ammeter,
    db,
    oldCenter: schematicComponent.center,
    newCenter: bestCenter,
  })
}
