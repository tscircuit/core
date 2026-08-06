# Circuit JSON Specification: Schematic Component Overview

> Created at 2024-10-23T22:29:08.481Z
> Latest Version: https://github.com/tscircuit/circuit-json/blob/main/docs/SCHEMATIC_COMPONENT_OVERVIEW.md

Any type below can be imported from `circuit-json`. Every type has a corresponding
snake_case version which is a zod type that can be used to parse unknown json,
for example `SchematicComponent` has a `schematic_component.parse` function that you
can also import.

```ts
interface SchematicTrace {
  type: "schematic_trace"
  schematic_trace_id: string
  source_trace_id: string
  edges: Array<{
    from: {
      x: number
      y: number
    }
    to: {
      x: number
      y: number
    }
    from_schematic_port_id?: string
    to_schematic_port_id?: string
  }>
}

interface SchematicBox {
  type: "schematic_box"
  schematic_component_id: string
  width: number
  height: number
  x: number
  y: number
}

interface SchematicLine {
  type: "schematic_line"
  schematic_component_id: string
  x1: number
  x2: number
  y1: number
  y2: number
}

interface SchematicError {
  schematic_error_id: string
  type: "schematic_error"
  error_type: "schematic_port_not_found"
  message: string
}

interface SchematicComponent {
  type: "schematic_component"
  rotation: number
  size: { width: number; height: number }
  center: { x: number; y: number }
  source_component_id: string
  schematic_component_id: string
  pin_spacing?: number
  pin_styles?: Record<
    string,
    {
      left_margin?: number
      right_margin?: number
      top_margin?: number
      bottom_margin?: number
    }
  >
  box_width?: number
  symbol_name?: string
  port_arrangement?:
    | {
        left_size: number
        right_size: number
        top_size?: number
        bottom_size?: number
      }
    | {
        left_side?: {
          pins: number[]
          direction?: "top-to-bottom" | "bottom-to-top"
        }
        right_side?: {
          pins: number[]
          direction?: "top-to-bottom" | "bottom-to-top"
        }
        top_side?: {
          pins: number[]
          direction?: "left-to-right" | "right-to-left"
        }
        bottom_side?: {
          pins: number[]
          direction?: "left-to-right" | "right-to-left"
        }
      }
  port_labels?: Record<string, string>
}

interface SchematicDebugRect {
  type: "schematic_debug_object"
  label?: string
  shape: "rect"
  center: { x: number; y: number }
  size: { width: number; height: number }
}

interface SchematicDebugLine {
  type: "schematic_debug_object"
  label?: string
  shape: "line"
  start: { x: number; y: number }
  end: { x: number; y: number }
}

type SchematicDebugObject = SchematicDebugRect | SchematicDebugLine

interface SchematicPort {
  type: "schematic_port"
  schematic_port_id: string
  source_port_id: string
  schematic_component_id?: string
  center: { x: number; y: number }
  facing_direction?: "up" | "down" | "left" | "right"
}

interface SchematicNetLabel {
  type: "schematic_net_label"
  source_net_id: string
  center: { x: number; y: number }
  anchor_side: "top" | "bottom" | "left" | "right"
  text: string
}

interface SchematicPath {
  type: "schematic_path"
  schematic_component_id: string
  fill_color?: "red" | "blue"
  is_filled?: boolean
  points: Array<{ x: number; y: number }>
}

interface SchematicText {
  type: "schematic_text"
  schematic_component_id: string
  schematic_text_id: string
  text: string
  position: {
    x: number
    y: number
  }
  rotation: number
  anchor: "center" | "left" | "right" | "top" | "bottom"
}
```

## Net labels

A net's name reaches the schematic in one of two forms.

An **anchored net label** is a `schematic_net_label`: the tag symbol that hangs
off the end of a wire, pointing back at it via `anchor_side`. This is the
general case, and the only form used for power and ground rails.

An **inline net label** is the name drawn parallel to the wire it belongs to -
above a horizontal trace, or to the left of a vertical one reading
bottom-to-top. Because it is rotated, it cannot be a `schematic_net_label`
(that element is always axis-aligned); it is emitted as a `schematic_text` with
`anchor: "center"`, `rotation` of `0` or `-90`, and the `source_trace_id` of the
trace it names. That id is what distinguishes an inline net label from
free-standing schematic text such as a reference designator.

Inline labels are applied automatically to point-to-point signal traces - a net
of exactly two ports, not power or ground, carrying a name the user chose
(`schDisplayLabel`, `displayName`, or `name` on the trace, or a named net). The
schematic trace solver places them and will decline when the wire has no room
for the name, in which case the net falls back to an anchored label. A net never
gets both forms.
