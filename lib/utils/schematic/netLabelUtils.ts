export const DEFAULT_SCHEMATIC_NET_LABEL_FONT_SIZE = 0.18
export const DEFAULT_SCHEMATIC_NET_LABEL_CHAR_WIDTH = 0.12
export const DEFAULT_SCHEMATIC_NET_LABEL_HORIZONTAL_PADDING = 0.12
export const DEFAULT_SCHEMATIC_MAX_TRACE_DISTANCE = 2.4
export const SOLVER_SOURCE_TRACE_ID_PREFIX = "solver_"

export const SCHEMATIC_LABEL_ANCHOR_SIDE = {
  right: "right",
  left: "left",
  top: "top",
  bottom: "bottom",
} as const

export type SchematicLabelAnchorSide =
  (typeof SCHEMATIC_LABEL_ANCHOR_SIDE)[keyof typeof SCHEMATIC_LABEL_ANCHOR_SIDE]

export const SCHEMATIC_LABEL_AXIS_DIRECTION = {
  right: "x+",
  left: "x-",
  top: "y+",
  bottom: "y-",
} as const
