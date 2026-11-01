import * as jscadModeling from "@jscad/modeling"
import type { Geom3 } from "@jscad/modeling/src/geometries/types"
import type {
  AnyCircuitElement,
  CadComponent,
  PcbBoard,
  PcbComponent,
} from "circuit-json"
import { mat4, vec3 } from "gl-matrix"
import { executeJscadOperations } from "jscad-planner"
import type { DrawCall } from "poppygl"

const { geom2, geom3 } = jscadModeling.geometries
const { extrudeLinear } = jscadModeling.extrusions

// Paired with circuit-json-to-gltf's convertCircuitJsonTo3D defaults.
const DEFAULT_BOARD_THICKNESS = 1.6
const DEFAULT_COMPONENT_HEIGHT = 2
const DEFAULT_HOLE_SEGMENTS = 24
const REDUCED_HOLE_SEGMENTS = 8
const HOLE_COUNT_THRESHOLD = 50

type Point3 = { x: number; y: number; z: number }

/** Circuit Z-up CAD mm to glTF world mm: (+X, +Y, +Z) = (-x, z, y). */
const CAD_TO_GLTF = mat4.fromValues(
  -1,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  0,
  1,
)

/** jscad plan Z-up to the exporter's scene frame (+X x, +Y z, +Z y). */
const PLAN_TO_SCENE = mat4.fromValues(
  1,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  0,
  1,
)

const material = { baseColorFactor: [1, 1, 1, 1], baseColorTexture: null }

export const createDrawCall = (
  positions: number[],
  model: mat4,
  mode?: number,
): DrawCall =>
  ({
    positions: Float32Array.from(positions),
    normals: null,
    uvs: null,
    indices: null,
    model,
    material,
    ...(mode === undefined ? {} : { mode }),
  }) as DrawCall

const geom3ToPositions = (geometry: Geom3) =>
  geom3
    .toPolygons(geometry)
    .flatMap(({ vertices }) =>
      vertices
        .slice(1, -1)
        .flatMap((vertex, i) => [
          ...vertices[0]!,
          ...vertex,
          ...vertices[i + 2]!,
        ]),
    )

/** Execute a cad_component's jscad plan in its native Z-up model mm. */
export const getJscadPlanPositions = (plan: unknown) =>
  (Array.isArray(plan) ? plan.flat(Infinity) : [plan])
    .flatMap((operation) =>
      [executeJscadOperations(jscadModeling as any, operation as any)].flat(
        Infinity,
      ),
    )
    .flatMap((geometry) => geom3ToPositions(geometry as Geom3))

const getBounds = (positions: ArrayLike<number>, matrix: mat4) => {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  const point = vec3.create()
  for (let i = 0; i < positions.length; i += 3) {
    vec3.transformMat4(
      point,
      [positions[i]!, positions[i + 1]!, positions[i + 2]!],
      matrix,
    )
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis]!, point[axis]!)
      max[axis] = Math.max(max[axis]!, point[axis]!)
    }
  }
  return { min, max }
}

/** Matches circuit-json-to-gltf's mesh-scale rotatePoint: X, then Y, then Z. */
const rotationXYZDegrees = ({ x, y, z }: Point3) => {
  const rad = Math.PI / 180
  const matrix = mat4.create()
  mat4.rotateZ(matrix, matrix, z * rad)
  mat4.rotateY(matrix, matrix, y * rad)
  mat4.rotateX(matrix, matrix, x * rad)
  return matrix
}

const boardNormalRotations: Record<
  NonNullable<CadComponent["model_board_normal_direction"]>,
  Point3
> = {
  "x+": { x: 0, y: 0, z: 90 },
  "x-": { x: 0, y: 0, z: -90 },
  "y+": { x: 0, y: 0, z: 0 },
  "y-": { x: 0, y: 0, z: 180 },
  "z+": { x: 0, y: 0, z: 0 },
  "z-": { x: 180, y: 0, z: 0 },
}

const getModelSourceName = (cad: CadComponent) =>
  cad.model_stl_url ||
  cad.model_obj_url ||
  cad.model_glb_url ||
  cad.model_gltf_url ||
  cad.model_step_url ||
  (cad.footprinter_string && !cad.model_jscad
    ? `footprinter model "${cad.footprinter_string}"`
    : undefined)

/**
 * Model matrix from a cad_component's jscad plan (Z-up model mm) to glTF world
 * mm, reproducing circuit-json-to-gltf's placement: unit scale, board normal,
 * origin, object fit, CAD rotation and position.
 */
export function getCadModelMatrix(
  cad: CadComponent,
  planPositions: ArrayLike<number>,
  selected: AnyCircuitElement[],
): mat4 {
  const pcbComponent = selected.find(
    (element): element is PcbComponent =>
      element.type === "pcb_component" &&
      element.pcb_component_id === cad.pcb_component_id,
  )
  const pcbBoard = selected.find(
    (element): element is PcbBoard => element.type === "pcb_board",
  )
  const boardThickness = pcbBoard?.thickness ?? DEFAULT_BOARD_THICKNESS
  const isBottomLayer = (cad.layer ?? pcbComponent?.layer) === "bottom"
  const unitScale = cad.model_unit_to_mm_scale_factor ?? 1
  const normalRotation =
    boardNormalRotations[cad.model_board_normal_direction ?? "z+"]

  // Scene-frame mesh: loader axis swap, unit scale, then board normal.
  const mesh = mat4.create()
  mat4.multiply(
    mesh,
    mat4.fromScaling(mat4.create(), [unitScale, unitScale, unitScale]),
    PLAN_TO_SCENE,
  )
  mat4.multiply(mesh, rotationXYZDegrees(normalRotation), mesh)

  const origin = getModelOrigin(cad, planPositions, mesh, normalRotation)
  mat4.multiply(
    mesh,
    mat4.fromTranslation(mat4.create(), [-origin.x, -origin.y, -origin.z]),
    mesh,
  )

  const size = cad.size
    ? {
        x: cad.size.x * unitScale,
        y: cad.size.z * unitScale,
        z: cad.size.y * unitScale,
      }
    : {
        x: pcbComponent?.width ?? 2,
        y: DEFAULT_COMPONENT_HEIGHT,
        z: pcbComponent?.height ?? 2,
      }
  if (cad.size) {
    const { min, max } = getBounds(planPositions, mesh)
    const fit = [size.x, size.y, size.z].map((target, axis) => {
      const span = max[axis]! - min[axis]!
      return span > 0 ? target / span : 1
    })
    const scale =
      cad.model_object_fit === "fill_bounds"
        ? fit
        : Array(3).fill(Math.min(...fit))
    mat4.multiply(
      mesh,
      mat4.fromScaling(mat4.create(), scale as [number, number, number]),
      mesh,
    )
  }

  const center = cad.position
    ? { x: cad.position.x, y: cad.position.z, z: cad.position.y }
    : {
        x: pcbComponent?.center.x ?? 0,
        y: (isBottomLayer ? -1 : 1) * (boardThickness / 2 + size.y / 2),
        z: pcbComponent?.center.y ?? 0,
      }

  // Paired with circuit-json-to-gltf's transformMesh: scene-frame rotation
  // about Y, then Z, then X, with circuit Y/Z rotation axes swapped.
  const rotation = cad.rotation
    ? { x: cad.rotation.x, y: cad.rotation.z, z: cad.rotation.y }
    : isBottomLayer
      ? { x: 180, y: 0, z: 0 }
      : { x: 0, y: 0, z: 0 }
  const rad = Math.PI / 180
  const boxRotation = mat4.create()
  mat4.rotateX(boxRotation, boxRotation, -rotation.x * rad)
  mat4.rotateZ(boxRotation, boxRotation, -rotation.z * rad)
  mat4.rotateY(boxRotation, boxRotation, -rotation.y * rad)

  const model = mat4.fromTranslation(mat4.create(), [
    -center.x,
    center.y,
    center.z,
  ])
  mat4.multiply(model, model, mat4.fromScaling(mat4.create(), [-1, 1, 1]))
  mat4.multiply(model, model, boxRotation)
  return mat4.multiply(model, model, mesh)
}

/** Paired with circuit-json-to-gltf's getMeshOrigin, in the scene frame. */
function getModelOrigin(
  cad: CadComponent,
  planPositions: ArrayLike<number>,
  mesh: mat4,
  normalRotation: Point3,
): Point3 {
  if (cad.model_origin_position) {
    const { x, y, z } = cad.model_origin_position
    // Paired with circuit-json-to-gltf's cad-component-box/getMeshOrigin:
    // authored JSCAD origins use the same Y/Z swap as the plan's triangles.
    const loaded = [x, z, y]
    const origin = cad.model_board_normal_direction
      ? vec3.transformMat4(
          vec3.create(),
          loaded as [number, number, number],
          rotationXYZDegrees(normalRotation),
        )
      : loaded
    return { x: origin[0]!, y: origin[1]!, z: origin[2]! }
  }
  const alignment = cad.model_origin_alignment ?? cad.anchor_alignment
  if (
    alignment !== "center_of_component_on_board_surface" &&
    alignment !== "center"
  )
    return { x: 0, y: 0, z: 0 }
  const bounds = getBounds(planPositions, mesh)
  if (alignment === "center")
    return {
      x: (bounds.min[0]! + bounds.max[0]!) / 2,
      y: (bounds.min[1]! + bounds.max[1]!) / 2,
      z: (bounds.min[2]! + bounds.max[2]!) / 2,
    }
  // Center of the vertices touching the board (lowest scene Y).
  const tolerance = Math.max(1e-6, (bounds.max[1]! - bounds.min[1]!) * 1e-5)
  const contact = {
    minX: Infinity,
    maxX: -Infinity,
    minZ: Infinity,
    maxZ: -Infinity,
  }
  const point = vec3.create()
  for (let i = 0; i < planPositions.length; i += 3) {
    vec3.transformMat4(
      point,
      [planPositions[i]!, planPositions[i + 1]!, planPositions[i + 2]!],
      mesh,
    )
    if (Math.abs(point[1]! - bounds.min[1]!) > tolerance) continue
    contact.minX = Math.min(contact.minX, point[0]!)
    contact.maxX = Math.max(contact.maxX, point[0]!)
    contact.minZ = Math.min(contact.minZ, point[2]!)
    contact.maxZ = Math.max(contact.maxZ, point[2]!)
  }
  return {
    x: (contact.minX + contact.maxX) / 2,
    y: 0,
    z: (contact.minZ + contact.maxZ) / 2,
  }
}

const circleLoop = (
  cx: number,
  cy: number,
  radius: number,
  segments: number,
): [number, number][] => {
  const count = Math.max(8, segments)
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
  })
}

const rectLoop = (cx: number, cy: number, width: number, height: number) =>
  [
    [cx - width / 2, cy - height / 2],
    [cx + width / 2, cy - height / 2],
    [cx + width / 2, cy + height / 2],
    [cx - width / 2, cy + height / 2],
  ] as [number, number][]

const signedArea = (loop: [number, number][]) =>
  loop.reduce((area, [x1, y1], i) => {
    const [x2, y2] = loop[(i + 1) % loop.length]!
    return area + (x1 * y2 - x2 * y1) / 2
  }, 0)

const getHoleLoop = (
  hole: AnyCircuitElement,
  segments: number,
): [number, number][] => {
  const h = hole as any
  const shape = h.hole_shape ?? h.shape
  if (typeof h.hole_diameter === "number")
    return circleLoop(h.x, h.y, h.hole_diameter / 2, segments)
  if (shape === "rect" && h.hole_width && h.hole_height)
    return rectLoop(h.x, h.y, h.hole_width, h.hole_height)
  throw new Error(
    `hole shape "${shape}" is not yet supported for drawing dimensions`,
  )
}

/** Board solid in CAD mm: outline extruded through its thickness, drilled. */
export function getBoardDrawCalls(
  board: PcbBoard,
  selected: AnyCircuitElement[],
): DrawCall[] {
  const thickness = board.thickness ?? DEFAULT_BOARD_THICKNESS
  const outline: [number, number][] =
    board.outline && board.outline.length >= 3
      ? board.outline.map(({ x, y }): [number, number] => [x, y])
      : rectLoop(board.center.x, board.center.y, board.width!, board.height!)
  const holes = selected.filter(
    (element) =>
      (element.type === "pcb_hole" || element.type === "pcb_plated_hole") &&
      (!("pcb_board_id" in element) ||
        !element.pcb_board_id ||
        element.pcb_board_id === board.pcb_board_id),
  )
  const segments =
    holes.length > HOLE_COUNT_THRESHOLD
      ? REDUCED_HOLE_SEGMENTS
      : DEFAULT_HOLE_SEGMENTS
  // Build the profile from its loops: booleans would snap vertices.
  const orient = (loop: [number, number][], counterClockwise: boolean) =>
    signedArea(loop) > 0 === counterClockwise ? loop : [...loop].reverse()
  const loops = [
    orient(outline, true),
    ...holes.map((hole) => orient(getHoleLoop(hole, segments), false)),
  ]
  const profile = geom2.create(
    loops.flatMap((loop) =>
      loop.map((point, i): [[number, number], [number, number]] => [
        point,
        loop[(i + 1) % loop.length]!,
      ]),
    ),
  )
  // Vertices stay board-relative, like the exporter's board mesh, so float32
  // positions keep their precision far from the origin.
  const { x: cx, y: cy } = board.center
  const solid = jscadModeling.transforms.translate(
    [-cx, -cy, -thickness / 2],
    extrudeLinear({ height: thickness }, profile),
  )
  return [
    createDrawCall(
      geom3ToPositions(solid),
      mat4.multiply(
        mat4.create(),
        CAD_TO_GLTF,
        mat4.fromTranslation(mat4.create(), [cx, cy, 0]),
      ),
    ),
  ]
}

/** Physical drawing geometry as poppygl draw calls in glTF world mm. */
export function getDrawingDrawCalls(selected: AnyCircuitElement[]): DrawCall[] {
  if (selected.some((element) => element.type === "pcb_bend"))
    throw new Error(
      "folded boards are not yet supported for drawing dimensions",
    )
  const drawCalls = selected
    .filter((element): element is PcbBoard => element.type === "pcb_board")
    .flatMap((board) => getBoardDrawCalls(board, selected))
  for (const cad of selected) {
    if (cad.type !== "cad_component") continue
    const external = getModelSourceName(cad)
    if (external)
      throw new Error(
        `model ${external.length > 80 ? `${external.slice(0, 80)}…` : external} cannot be loaded for drawing dimensions`,
      )
    if (!cad.model_jscad) continue
    const positions = getJscadPlanPositions(cad.model_jscad)
    drawCalls.push(
      createDrawCall(positions, getCadModelMatrix(cad, positions, selected)),
    )
  }
  return drawCalls
}
