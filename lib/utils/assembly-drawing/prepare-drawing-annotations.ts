import type {
  DrawingPartLabel,
  DrawingPageNote,
  DrawingExplosionMove,
} from "circuit-json"
import type { AssemblyDrawingPage } from "lib/components/primitive-components/AssemblyDrawingPage"
import { AssemblyDrawingPartLabel } from "lib/components/primitive-components/AssemblyDrawingPartLabel"
import { AssemblyDrawingNote } from "lib/components/primitive-components/AssemblyDrawingNote"
import { isAssemblyDrawingView, type AssemblyDrawingView } from "./drawing-view"
import {
  resolveDrawingStageSelection,
  selectDrawingReferences,
  toDrawingPartSelection,
  type DrawingMembership,
} from "./resolve-drawing-stage-selection"

type LabelContent = Omit<
  DrawingPartLabel,
  | "type"
  | "drawing_part_label_id"
  | "drawing_part_view_id"
  | "drawing_explosion_view_id"
>
type NoteContent = Omit<
  DrawingPageNote,
  | "type"
  | "drawing_page_note_id"
  | "drawing_page_id"
  | "drawing_part_view_id"
  | "drawing_explosion_view_id"
>

/** Paper positions are page-anchor-relative points or view-center offsets in mm,
 * +X right/+Y up. Leader anchors are assembled right-handed CAD world points in
 * mm (+Z above); renderers apply the selected part's displacement. */
export function prepareDrawingAnnotations(
  page: AssemblyDrawingPage,
  views: {
    view: AssemblyDrawingView
    membership: DrawingMembership
    moves?: DrawingExplosionMove[]
    factor?: number
  }[],
) {
  const labels: { view: AssemblyDrawingView; content: LabelContent }[] = []
  const notes: { view?: AssemblyDrawingView; content: NoteContent }[] = []
  for (const prepared of views) {
    for (const child of prepared.view.children) {
      if (!(child instanceof AssemblyDrawingPartLabel)) continue
      const props = child._parsedProps
      const membership = resolveDrawingStageSelection(child, props)
      if (
        membership.source_component_ids.some(
          (source) =>
            !prepared.membership.source_component_ids.includes(source),
        ) ||
        membership.pcb_board_ids.some(
          (board) => !prepared.membership.pcb_board_ids.includes(board),
        )
      )
        throw new Error(
          `Drawing label "${props.text}" targets parts outside its view`,
        )
      const shifts = new Set(
        [
          ...membership.source_component_ids.map(
            (source) =>
              prepared.moves?.find((move) =>
                move.source_component_ids?.includes(source),
              )?.translation,
          ),
          ...membership.pcb_board_ids.map(() => undefined),
        ].map((shift) =>
          JSON.stringify({
            x: (shift?.x ?? 0) * (prepared.factor ?? 1),
            y: (shift?.y ?? 0) * (prepared.factor ?? 1),
            z: (shift?.z ?? 0) * (prepared.factor ?? 1),
          }),
        ),
      )
      if (shifts.size > 1)
        throw new Error(
          `Drawing label "${props.text}" targets parts with different displacements`,
        )
      labels.push({
        view: prepared.view,
        content: {
          ...toDrawingPartSelection(membership),
          text: props.text,
          anchor: props.anchor,
          label_position:
            props.paperX !== undefined || props.paperY !== undefined
              ? { x: props.paperX, y: props.paperY }
              : undefined,
          x_offset_from_view_center: props.xOffsetFromViewCenter,
          y_offset_from_view_center: props.yOffsetFromViewCenter,
        },
      })
    }
  }
  for (const child of [
    ...page.children,
    ...views.flatMap(({ view }) => view.children),
  ]) {
    if (!(child instanceof AssemblyDrawingNote)) continue
    const props = child._parsedProps
    let view =
      child.parent && isAssemblyDrawingView(child.parent)
        ? child.parent
        : undefined
    if (props.viewRef) {
      const matches = selectDrawingReferences(child, props.viewRef).filter(
        (part) => isAssemblyDrawingView(part) && part.parent === page,
      )
      if (matches.length !== 1)
        throw new Error(
          `Drawing note "${props.text}" viewRef "${props.viewRef}" must select one view on its page`,
        )
      view = matches[0] as AssemblyDrawingView
    }
    if (
      !view &&
      (props.xOffsetFromViewCenter !== undefined ||
        props.yOffsetFromViewCenter !== undefined)
    )
      throw new Error(
        `Drawing note "${props.text}" needs a viewRef for view-relative offsets`,
      )
    notes.push({
      view,
      content: {
        text: props.text,
        font_size: props.fontSize,
        position:
          props.paperX !== undefined || props.paperY !== undefined
            ? { x: props.paperX, y: props.paperY }
            : undefined,
        x_offset_from_view_center: props.xOffsetFromViewCenter,
        y_offset_from_view_center: props.yOffsetFromViewCenter,
      },
    })
  }
  return { labels, notes }
}
