import type { DrawingPartView, DrawingPartViewDirection } from "circuit-json"
import type { AssemblyDrawingPartViewDirection } from "@tscircuit/props"
import type { AssemblyDrawingPage } from "./AssemblyDrawingPage"
import { AssemblyDrawingTitleBlock } from "lib/components/primitive-components/AssemblyDrawingTitleBlock"
import { resolveDrawingViewCenters } from "lib/utils/assembly-drawing/resolve-drawing-view-centers"
import type { ResolvedDrawingDimension } from "lib/utils/assembly-drawing/dimensions/resolve-drawing-dimensions"
import { resolveDrawingPartSelection } from "lib/utils/assembly-drawing/resolve-drawing-part-selection"

/** Camera directions remain CAD world directions (+Z up). Viewport centers are
 * paper-space points in mm (+X right, +Y up); renderers handle frame conversion.
 */
const directions: Record<
  AssemblyDrawingPartViewDirection,
  DrawingPartViewDirection
> = {
  "x+": "x_positive",
  "x-": "x_negative",
  "y+": "y_positive",
  "y-": "y_negative",
  "z+": "z_positive",
  "z-": "z_negative",
  isometric: "isometric",
}

export function AssemblyDrawingPage_doInitialDrawingRender(
  page: AssemblyDrawingPage,
) {
  const { db } = page.root!
  const props = page._parsedProps
  // Resolve the entire page before inserting records, including forward references.
  const views = resolveDrawingViewCenters(page).map(({ view, center }) => ({
    view,
    center,
    selection: resolveDrawingPartSelection(view),
  }))
  const preparedViews = views.map(({ view, center, selection }) => {
    const viewProps = view._parsedProps
    const drawingView: Omit<
      DrawingPartView,
      "type" | "drawing_part_view_id" | "drawing_page_id"
    > = {
      ...selection,
      name: viewProps.name,
      display_name: viewProps.displayName,
      direction: directions[viewProps.direction],
      center,
      width: viewProps.width,
      height: viewProps.height,
      show_hidden_edges: viewProps.showHiddenEdges,
      section: viewProps.section
        ? {
            axis: viewProps.section.axis,
            offset: viewProps.section.offset,
            keep_side: viewProps.section.keepSide,
            hatch_spacing: viewProps.section.hatchSpacing,
          }
        : undefined,
    }
    return { view, drawingView, dimensions: [] as ResolvedDrawingDimension[] }
  })
  const insertPage = () => {
    const { drawing_page_id } = db.drawing_page.insert({
      name: props.name,
      display_name: props.displayName,
      width: props.width,
      height: props.height,
      page_size: props.size,
      orientation: props.size ? (props.orientation ?? "landscape") : undefined,
    })
    for (const { drawingView, dimensions } of preparedViews) {
      const { drawing_part_view_id } = db.drawing_part_view.insert({
        drawing_page_id,
        ...drawingView,
      })
      for (const dimension of dimensions)
        db.drawing_dimension_line.insert({ drawing_part_view_id, ...dimension })
    }
    const block = page.children.find(
      (child): child is AssemblyDrawingTitleBlock =>
        child instanceof AssemblyDrawingTitleBlock,
    )?._parsedProps
    if (block)
      db.drawing_page_title_block.insert({
        drawing_page_id,
        title: block.title,
        legal_owner: block.legalOwner,
        identification_number: block.identificationNumber,
        revision_index: block.revisionIndex,
        date_of_issue: block.dateOfIssue,
        creator: block.creator,
        approval_person: block.approvalPerson,
        sheet_number: block.sheetNumber,
        number_of_sheets: block.numberOfSheets,
      })
  }
  if (!views.some(({ view }) => view.children.length)) {
    insertPage()
    return
  }
  const circuitJson = db.toArray()
  page._queueAsyncEffect("resolve-drawing-dimensions", async () => {
    try {
      const { resolveDrawingDimensions } = await import(
        "lib/utils/assembly-drawing/dimensions/resolve-drawing-dimensions"
      )
      for (const prepared of preparedViews) {
        prepared.dimensions = await resolveDrawingDimensions(
          prepared.view,
          prepared.drawingView,
          circuitJson,
        )
      }
      // Commit only after the entire page has valid geometry and annotations.
      insertPage()
    } catch (error) {
      page.drawingRenderError = error
      page._markDirty("DrawingRender")
    }
  })
}
