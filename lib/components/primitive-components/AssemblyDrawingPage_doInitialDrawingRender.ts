import { resolveDrawingDimensions } from "./resolve-drawing-dimensions"
import type { DrawingPartView, DrawingPartViewDirection } from "circuit-json"
import type { AssemblyDrawingPartViewDirection } from "@tscircuit/props"
import type { AssemblyDrawingPage } from "./AssemblyDrawingPage"
import { AssemblyDrawingTitleBlock } from "./AssemblyDrawingTitleBlock"
import { resolveDrawingViewCenters } from "./resolve-drawing-view-centers"
import { resolveDrawingPartSelection } from "./resolve-drawing-part-selection"

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
  const { drawing_page_id } = db.drawing_page.insert({
    name: props.name,
    display_name: props.displayName,
    width: props.width,
    height: props.height,
    page_size: props.size,
    orientation: props.size ? (props.orientation ?? "landscape") : undefined,
  })
  const drawingViews: DrawingPartView[] = []
  for (const { view, center, selection } of views) {
    const viewProps = view._parsedProps
    drawingViews.push(
      db.drawing_part_view.insert({
        drawing_page_id,
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
      }),
    )
  }
  if (views.some(({ view }) => view.children.length)) {
    page._queueAsyncEffect("resolve drawing dimensions", async () => {
      try {
        const lines = []
        for (const [index, { view }] of views.entries())
          lines.push(
            ...(await resolveDrawingDimensions(view, drawingViews[index]!)),
          )
        for (const line of lines) db.drawing_dimension_line.insert(line)
      } catch (error) {
        page.drawingDimensionError =
          error instanceof Error
            ? error
            : new Error("Unable to resolve drawing dimensions")
        page._markDirty("DrawingRender")
      }
    })
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
