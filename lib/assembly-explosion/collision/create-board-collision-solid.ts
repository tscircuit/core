import type {
  AnyCircuitElement,
  PcbBoard,
  PcbHole,
  PcbPlatedHole,
} from "circuit-json"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import type {
  ManifoldToplevel,
  Manifold,
  CrossSection,
  Vec2,
} from "manifold-3d"

const ellipse = (width: number, height: number): Vec2[] =>
  Array.from({ length: 64 }, (_, i) => [
    (width / 2) * Math.cos((i * Math.PI) / 32),
    (height / 2) * Math.sin((i * Math.PI) / 32),
  ])
const rectangle = (width: number, height: number): Vec2[] => [
  [-width / 2, -height / 2],
  [width / 2, -height / 2],
  [width / 2, height / 2],
  [-width / 2, height / 2],
]
const roundedRectangle = (
  width: number,
  height: number,
  radius: number,
): Vec2[] => {
  const r = Math.min(radius, width / 2, height / 2)
  if (!r) return rectangle(width, height)
  return Array.from({ length: 4 }, (_, corner) => {
    const angle = (corner * Math.PI) / 2
    const cx = (corner === 0 || corner === 3 ? 1 : -1) * (width / 2 - r)
    const cy = (corner < 2 ? 1 : -1) * (height / 2 - r)
    return Array.from(
      { length: 17 },
      (_, step): Vec2 => [
        cx + r * Math.cos(angle + (step * Math.PI) / 32),
        cy + r * Math.sin(angle + (step * Math.PI) / 32),
      ],
    )
  }).flat()
}
const place = (loop: Vec2[], x: number, y: number, rotation = 0) => {
  const transform = compose(translate(x, y), rotateDEG(rotation))
  return loop.map((point) => applyToPoint(transform, point) as Vec2)
}

function drillLoop(hole: PcbHole | PcbPlatedHole): Vec2[] | undefined {
  const shape = "hole_shape" in hole ? hole.hole_shape : hole.shape
  const diameter = "hole_diameter" in hole ? hole.hole_diameter : undefined
  const width = "hole_width" in hole ? hole.hole_width : diameter
  const height = "hole_height" in hole ? hole.hole_height : diameter
  if (!width || !height) return undefined
  let loop: Vec2[]
  if (shape === "circle" || shape === "oval") loop = ellipse(width, height)
  else if (shape === "rect" || shape === "square")
    loop = rectangle(width, height)
  else if (shape === "pill" || shape === "rotated_pill")
    loop = roundedRectangle(width, height, Math.min(width, height) / 2)
  else return undefined
  return place(
    loop,
    hole.x + ("hole_offset_x" in hole ? (hole.hole_offset_x ?? 0) : 0),
    hole.y + ("hole_offset_y" in hole ? (hole.hole_offset_y ?? 0) : 0),
    "ccw_rotation" in hole ? (hole.ccw_rotation ?? 0) : 0,
  )
}

/** PCB substrate solid in circuit-world mm (+X right, +Y top, +Z above),
 * centered through Z=0, with physical drills and cutouts removed. Coordinates
 * are points. Curves are faceted; copper and solder are not substrate geometry.
 * Undefined means unsupported/ambiguous geometry, never a bounding-box fallback.
 * The caller owns the returned WASM solid.
 */
export function createBoardCollisionSolid(
  board: PcbBoard,
  circuitJson: AnyCircuitElement[],
  manifold: ManifoldToplevel,
): Manifold | undefined {
  if (circuitJson.some((r) => r.type === "pcb_bend")) return undefined
  const boards = circuitJson.filter((r) => r.type === "pcb_board")
  const drills: Vec2[][] = []
  for (const record of circuitJson) {
    if (
      record.type !== "pcb_hole" &&
      record.type !== "pcb_plated_hole" &&
      record.type !== "pcb_cutout" &&
      record.type !== "pcb_via"
    )
      continue
    // Prefer explicit ownership; subcircuit identities are the schema's normal
    // drill ownership. Ambiguous multi-board records make coverage incomplete.
    if ("pcb_board_id" in record && record.pcb_board_id) {
      if (record.pcb_board_id !== board.pcb_board_id) continue
    } else if (boards.length > 1) {
      if (
        !record.subcircuit_id ||
        !boards.some((b) => b.subcircuit_id === record.subcircuit_id)
      )
        return undefined
      if (record.subcircuit_id !== board.subcircuit_id) continue
    }
    if (record.type === "pcb_hole" || record.type === "pcb_plated_hole") {
      const loop = drillLoop(record)
      if (!loop) return undefined
      drills.push(loop)
    } else if (record.type === "pcb_via") {
      if (!record.layers.includes("top") || !record.layers.includes("bottom"))
        return undefined
      drills.push(
        place(
          ellipse(record.hole_diameter, record.hole_diameter),
          record.x,
          record.y,
        ),
      )
    } else if (record.shape === "circle") {
      drills.push(
        place(
          ellipse(record.radius * 2, record.radius * 2),
          record.center.x,
          record.center.y,
        ),
      )
    } else if (record.shape === "rect") {
      drills.push(
        place(
          roundedRectangle(
            record.width,
            record.height,
            record.corner_radius ?? 0,
          ),
          record.center.x,
          record.center.y,
          record.rotation ?? 0,
        ),
      )
    } else if (record.shape === "polygon") {
      drills.push(record.points.map(({ x, y }) => [x, y]))
    } else return undefined
  }
  const outline = board.outline?.length
    ? board.outline.map(({ x, y }): Vec2 => [x, y])
    : board.width && board.height
      ? place(
          rectangle(board.width, board.height),
          board.center.x,
          board.center.y,
        )
      : undefined
  if (!outline) return undefined
  const allocated: CrossSection[] = []
  const section = (loop: Vec2[]) => {
    const profile = new manifold.CrossSection([loop], "EvenOdd")
    allocated.push(profile)
    return profile
  }
  let extruded: Manifold | undefined
  try {
    let profile = section(outline)
    if (drills.length) {
      const holes = manifold.CrossSection.union(drills.map(section))
      allocated.push(holes)
      profile = profile.subtract(holes)
      allocated.push(profile)
    }
    const thickness = board.thickness ?? 1.6
    extruded = profile.extrude(thickness)
    const solid = extruded.translate([0, 0, -thickness / 2])
    if (solid.status() !== "NoError" || solid.isEmpty()) {
      solid.delete()
      throw new Error("PCB does not define a valid closed substrate")
    }
    return solid
  } finally {
    extruded?.delete()
    for (const profile of allocated) profile.delete()
  }
}
