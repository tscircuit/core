import type { Point3 } from "circuit-json"
import { vec3 } from "gl-matrix"
import type { BoardDirectionVector } from "lib/utils/pcb/transform-footprint-insertion-direction"
import type { NormalComponent } from "../base-components/NormalComponent"
import type { AssemblyCable } from "./AssemblyCable"

function getConnectorPins(cable: AssemblyCable, connector: NormalComponent) {
  const db = cable.root!.db
  return db.source_port.list().flatMap((sourcePort) => {
    if (sourcePort.source_component_id !== connector.source_component_id)
      return []
    const pcbPort = db.pcb_port
      .list()
      .find(
        (port) =>
          port.source_port_id === sourcePort.source_port_id &&
          port.pcb_component_id === connector.pcb_component_id,
      )
    if (!pcbPort) return []
    const hint = [sourcePort.name, ...(sourcePort.port_hints ?? [])].find(
      (name) => /^(?:pin)?\d+$/.test(name),
    )
    const pin =
      sourcePort.pin_number ??
      (hint ? Number(hint.replace(/^pin/, "")) : undefined)
    return [{ position: pcbPort, pin }]
  })
}

/** Internal contact row center in right-handed circuit-world XY, mm. The
 * signal ports already carry the footprint rotation and layer reflection.
 * rowOffset is toward the header hold-downs from the solder-tail row; the
 * outward Z sign makes the perpendicular follow the physical layer flip.
 */
export function resolveAssemblyCableContactRowCenter(
  cable: AssemblyCable,
  connector: NormalComponent,
  outward: BoardDirectionVector,
  rowOffset: number,
): { x: number; y: number } | undefined {
  const pins = getConnectorPins(cable, connector)
  const first = pins.find(({ pin }) => pin === 1)?.position
  if (!first || pins.length < 2) return undefined
  const center = pins.reduce(
    (sum, { position }) => ({
      x: sum.x + position.x / pins.length,
      y: sum.y + position.y / pins.length,
    }),
    { x: 0, y: 0 },
  )
  const row = vec3.normalize(vec3.create(), [
    center.x - first.x,
    center.y - first.y,
    0,
  ])
  const towardHoldDowns = vec3.cross(
    vec3.create(),
    [outward.x, outward.y, outward.z],
    row,
  )
  return {
    x: center.x + towardHoldDowns[0] * rowOffset,
    y: center.y + towardHoldDowns[1] * rowOffset,
  }
}

/** Resolve the pin 1 mating-face point in right-handed circuit world, mm
 * (+X right, +Y top, +Z above). Emitted PCB ports already include the actual
 * footprint rotation and layer reflection; do not repeat those transforms.
 */
export function resolveAssemblyCablePin1Position(
  cable: AssemblyCable,
  connector: NormalComponent,
  matingCenter: Point3,
  outward: BoardDirectionVector,
): Point3 | undefined {
  const pins = getConnectorPins(cable, connector)
  const pin1 = pins.find(({ pin }) => pin === 1)?.position
  if (!pin1 || pins.length < 2) return undefined
  const center = pins.reduce(
    (sum, { position }) => ({
      x: sum.x + position.x / pins.length,
      y: sum.y + position.y / pins.length,
    }),
    { x: 0, y: 0 },
  )
  // Move the contact row from its PCB pad plane to the connector mating
  // center, retaining the transverse offset toward the physical pin 1.
  const offset = vec3.fromValues(pin1.x - center.x, pin1.y - center.y, 0)
  const axis = vec3.normalize(vec3.create(), [outward.x, outward.y, outward.z])
  vec3.scaleAndAdd(offset, offset, axis, -vec3.dot(offset, axis))
  if (vec3.length(offset) < 1e-6) return undefined
  return {
    x: matingCenter.x + offset[0],
    y: matingCenter.y + offset[1],
    z: matingCenter.z + offset[2],
  }
}
