import {
  type CircuitJsonUtilObjects,
  getPcbElementBounds,
} from "@tscircuit/circuit-json-util"
import {
  type Bounds,
  getBoundFromCenteredRect,
  getBoundsFromPoints,
} from "@tscircuit/math-utils"
import type {
  PcbCutout,
  PcbHole,
  PcbPlatedHole,
  PcbSilkscreenRect,
  Point,
} from "circuit-json"
import type {
  PcbComponentId,
  PcbSilkscreenTextId,
} from "lib/utils/circuit-json/circuit-json-id-types"
import {
  getEllipseOutlineBoundsList,
  getRotatedRectBounds,
  getStrokeBounds,
  getTextBounds,
} from "lib/utils/silkscreen-label-placement/label-geometry"
import type {
  SilkscreenLabelLayer,
  SilkscreenLabelObstacle,
  SilkscreenLabelObstacleKind,
} from "lib/utils/silkscreen-label-placement/types"

// circuit-to-svg draws silkscreen ovals with a 0.1 mm stroke
const SILKSCREEN_OVAL_STROKE_WIDTH = 0.1

/** The fields that tell which board an element is on. */
interface BoardMembership {
  pcb_component_id?: PcbComponentId | null
  subcircuit_id?: string
}

const getHoleBounds = (hole: PcbHole) => {
  const center = { x: hole.x, y: hole.y }
  if ("hole_diameter" in hole)
    return getBoundFromCenteredRect({
      center,
      width: hole.hole_diameter,
      height: hole.hole_diameter,
    })
  return getRotatedRectBounds(
    center,
    hole.hole_width,
    hole.hole_height,
    hole.hole_shape === "rotated_pill" ? hole.ccw_rotation : 0,
  )
}

const getPlatedHoleBounds = (platedHole: PcbPlatedHole) =>
  platedHole.shape === "hole_with_polygon_pad"
    ? // The pad outline is relative to the hole.
      getBoundsFromPoints(
        platedHole.pad_outline.map((point) => ({
          x: platedHole.x + point.x,
          y: platedHole.y + point.y,
        })),
      )
    : getPcbElementBounds(platedHole)

const getPathBoundsList = (route: Point[], strokeWidth: number): Bounds[] =>
  route
    .slice(1)
    .map((point, i) => getStrokeBounds(route[i]!, point, strokeWidth))

const getCutoutBoundsList = (cutout: PcbCutout): Array<Bounds | null> =>
  cutout.shape === "path"
    ? getPathBoundsList(cutout.route, cutout.slot_width)
    : [getPcbElementBounds(cutout)]

/** An outline counts as its four sides, so a label may sit inside it. */
const getSilkscreenRectBoundsList = (rect: PcbSilkscreenRect): Bounds[] => {
  const ccwRotation = rect.ccw_rotation ?? 0
  if (rect.is_filled || ccwRotation % 90 !== 0)
    return [
      getRotatedRectBounds(
        rect.center,
        rect.width + rect.stroke_width,
        rect.height + rect.stroke_width,
        ccwRotation,
      ),
    ]
  if (rect.has_stroke === false) return []
  const { minX, minY, maxX, maxY } = getRotatedRectBounds(
    rect.center,
    rect.width,
    rect.height,
    ccwRotation,
  )
  const corners = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ]
  return corners.map((corner, i) =>
    getStrokeBounds(corner, corners[(i + 1) % 4]!, rect.stroke_width),
  )
}

/**
 * Copper, silkscreen, courtyards, fixed text and notes on one side, holes and cutouts,
 * which go through the board, and on the top side, mounted boards. Traces and
 * vias are left out, so routing never moves a label.
 */
export const getSilkscreenLabelObstacles = ({
  db,
  layer,
  pcbBoardId,
  getPcbComponentIdOnBoard,
  movablePcbSilkscreenTextIds,
}: {
  db: CircuitJsonUtilObjects
  layer: SilkscreenLabelLayer
  pcbBoardId: string
  /**
   * Returns the id of the board part an element belongs to, null for a
   * board-level element, or undefined for an element that is not on the board.
   */
  getPcbComponentIdOnBoard: (
    element: BoardMembership,
  ) => PcbComponentId | null | undefined
  movablePcbSilkscreenTextIds: Set<PcbSilkscreenTextId>
}): SilkscreenLabelObstacle[] => {
  const obstacles: SilkscreenLabelObstacle[] = []
  const addObstacles = (
    kind: SilkscreenLabelObstacleKind,
    element: BoardMembership & { layer?: string },
    boundsList: Array<Bounds | null>,
  ) => {
    // Elements without a layer, like holes, go through the board
    if (element.layer !== undefined && element.layer !== layer) return
    const pcbComponentId = getPcbComponentIdOnBoard(element)
    if (pcbComponentId === undefined) return
    for (const bounds of boundsList) {
      if (!bounds) continue
      obstacles.push({ kind, bounds, pcbComponentId })
    }
  }

  for (const pad of db.pcb_smtpad.list())
    addObstacles("copper", pad, [getPcbElementBounds(pad)])
  for (const platedHole of db.pcb_plated_hole.list())
    addObstacles("copper", platedHole, [getPlatedHoleBounds(platedHole)])
  for (const copperText of db.pcb_copper_text.list())
    addObstacles("copper", copperText, [getTextBounds(copperText)])
  for (const hole of db.pcb_hole.list())
    addObstacles("hole", hole, [getHoleBounds(hole)])
  for (const cutout of db.pcb_cutout.list())
    addObstacles("cutout", cutout, getCutoutBoundsList(cutout))

  for (const path of db.pcb_silkscreen_path.list())
    addObstacles(
      "silkscreen",
      path,
      getPathBoundsList(path.route, path.stroke_width),
    )
  for (const line of db.pcb_silkscreen_line.list())
    addObstacles("silkscreen", line, [
      getStrokeBounds(
        { x: line.x1, y: line.y1 },
        { x: line.x2, y: line.y2 },
        line.stroke_width,
      ),
    ])
  for (const rect of db.pcb_silkscreen_rect.list())
    addObstacles("silkscreen", rect, getSilkscreenRectBoundsList(rect))
  for (const circle of db.pcb_silkscreen_circle.list()) {
    const diameter = 2 * circle.radius + circle.stroke_width
    addObstacles(
      "silkscreen",
      circle,
      circle.is_filled
        ? [
            getBoundFromCenteredRect({
              center: circle.center,
              width: diameter,
              height: diameter,
            }),
          ]
        : getEllipseOutlineBoundsList({
            center: circle.center,
            radiusX: circle.radius,
            radiusY: circle.radius,
            ccwRotation: 0,
            strokeWidth: circle.stroke_width,
          }),
    )
  }
  for (const oval of db.pcb_silkscreen_oval.list())
    addObstacles(
      "silkscreen",
      oval,
      getEllipseOutlineBoundsList({
        center: oval.center,
        radiusX: oval.radius_x,
        radiusY: oval.radius_y,
        ccwRotation: oval.ccw_rotation ?? 0,
        strokeWidth: SILKSCREEN_OVAL_STROKE_WIDTH,
      }),
    )
  for (const pill of db.pcb_silkscreen_pill.list())
    addObstacles("silkscreen", pill, [getPcbElementBounds(pill)])
  // A mounted part hides the silkscreen under it; its courtyard is the nearest
  // thing to its outline that circuit-json has
  for (const rect of db.pcb_courtyard_rect.list())
    addObstacles("courtyard", rect, [
      getRotatedRectBounds(
        rect.center,
        rect.width,
        rect.height,
        rect.ccw_rotation ?? 0,
      ),
    ])
  for (const outline of db.pcb_courtyard_outline.list())
    addObstacles("courtyard", outline, [getBoundsFromPoints(outline.outline)])
  for (const polygon of db.pcb_courtyard_polygon.list())
    addObstacles("courtyard", polygon, [getBoundsFromPoints(polygon.points)])
  for (const circle of db.pcb_courtyard_circle.list())
    addObstacles("courtyard", circle, [
      getBoundFromCenteredRect({
        center: circle.center,
        width: 2 * circle.radius,
        height: 2 * circle.radius,
      }),
    ])
  for (const pill of db.pcb_courtyard_pill.list())
    addObstacles("courtyard", pill, [
      getBoundFromCenteredRect({
        center: pill.center,
        width: pill.width,
        height: pill.height,
      }),
    ])

  // Graphics block their whole outline, since PNG graphics have no paths
  for (const graphic of db.pcb_silkscreen_graphic.list())
    addObstacles("silkscreen", graphic, [
      getBoundsFromPoints(graphic.brep_shape.outer_ring.vertices),
    ])

  for (const text of db.pcb_silkscreen_text.list()) {
    if (movablePcbSilkscreenTextIds.has(text.pcb_silkscreen_text_id)) continue
    addObstacles("text", text, [getTextBounds(text)])
  }
  // Notes are never drawn mirrored, so their layer is left out of the bounds
  for (const fabricationNoteText of db.pcb_fabrication_note_text.list())
    addObstacles("note", fabricationNoteText, [
      getTextBounds({
        text: fabricationNoteText.text,
        font_size: fabricationNoteText.font_size,
        anchor_position: fabricationNoteText.anchor_position,
        anchor_alignment: fabricationNoteText.anchor_alignment,
        ccw_rotation: fabricationNoteText.ccw_rotation,
      }),
    ])
  for (const note of db.pcb_note_text.list()) {
    if (!note.text) continue
    addObstacles("note", note, [
      getTextBounds({
        text: note.text,
        font_size: note.font_size,
        anchor_position: note.anchor_position,
        anchor_alignment: note.anchor_alignment,
      }),
    ])
  }
  // A board mounted on this one sits on its top and hides the silkscreen under it
  if (layer === "top") {
    for (const mountedBoard of db.pcb_board.list()) {
      if (mountedBoard.carrier_pcb_board_id !== pcbBoardId) continue
      const bounds = mountedBoard.outline?.length
        ? getBoundsFromPoints(mountedBoard.outline)
        : mountedBoard.width && mountedBoard.height
          ? getBoundFromCenteredRect({
              center: mountedBoard.center,
              width: mountedBoard.width,
              height: mountedBoard.height,
            })
          : null
      if (bounds)
        obstacles.push({ kind: "mounted_board", bounds, pcbComponentId: null })
    }
  }
  return obstacles
}
