import type {
  DrawingPartView,
  DrawingPartViewDirection,
  DrawingPartSelection,
  DrawingDimensionLine,
} from "circuit-json"
import type { AssemblyDrawingPartViewDirection } from "@tscircuit/props"
import type { AssemblyDrawingPartView } from "../AssemblyDrawingPartView"
import type { AssemblyDrawingPage } from "./AssemblyDrawingPage"
import { AssemblyDrawingTitleBlock } from "lib/components/primitive-components/AssemblyDrawingTitleBlock"
import { resolveDrawingViewCenters } from "lib/utils/assembly-drawing/resolve-drawing-view-centers"
import type { ResolvedDrawingDimension } from "lib/utils/assembly-drawing/dimensions/resolve-drawing-dimensions"
import { resolveDrawingPartSelection } from "lib/utils/assembly-drawing/resolve-drawing-part-selection"

import { AssemblyDrawingExplosionView } from "../AssemblyDrawingExplosionView"
import {
  usesResolvedDrawingScene,
  type AssemblyDrawingView,
} from "lib/utils/assembly-drawing/drawing-view"
import { resolveDrawingExplosion } from "lib/utils/assembly-drawing/resolve-drawing-explosion"
import {
  resolveDrawingStage,
  resolveDrawingStageSelection,
  toDrawingPartSelection,
  type DrawingMembership,
} from "lib/utils/assembly-drawing/resolve-drawing-stage-selection"
import { prepareDrawingAnnotations } from "lib/utils/assembly-drawing/prepare-drawing-annotations"
import { getDrawingViewGeometry } from "lib/utils/assembly-drawing/geometry/get-drawing-view-geometry"

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

type ViewReference = Pick<
  DrawingDimensionLine,
  "drawing_part_view_id" | "drawing_explosion_view_id"
>
type DrawingViewport = Omit<
  DrawingPartView,
  "type" | "drawing_part_view_id" | "drawing_page_id"
> &
  Pick<DrawingPartSelection, "pcb_board_ids">

export function AssemblyDrawingPage_doInitialDrawingRender(
  page: AssemblyDrawingPage,
) {
  const { db } = page.root!
  const props = page._parsedProps
  const circuitJson = db.toArray()
  // Resolve every reference before committing a page. Forward stage/view references
  // work regardless of TSX order, and invalid annotations leave no partial sheet.
  const preparedViews = resolveDrawingViewCenters(page).map(
    ({ view, center }) => {
      const viewProps = view._parsedProps
      const explosion =
        view instanceof AssemblyDrawingExplosionView
          ? resolveDrawingExplosion(view, circuitJson)
          : undefined
      const stage =
        !explosion && viewProps.stageRef
          ? resolveDrawingStage(view, viewProps.stageRef)
          : undefined
      const stageMembership = stage
        ? resolveDrawingStageSelection(stage, stage._parsedProps)
        : explosion?.membership
      const selection =
        stageMembership ??
        resolveDrawingPartSelection(view as AssemblyDrawingPartView)
      const geometry = getDrawingViewGeometry(circuitJson, selection)
      const membership: DrawingMembership = stageMembership ?? {
        source_component_ids: [
          ...new Set(
            geometry
              .filter((part) => part.type === "cad_component")
              .map((part) => part.source_component_id),
          ),
        ],
        pcb_board_ids: geometry
          .filter((part) => part.type === "pcb_board")
          .map((part) => part.pcb_board_id),
      }
      const drawingView: DrawingViewport = {
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
      return {
        view,
        stage,
        explosion,
        membership,
        drawingView,
        dimensions: [] as ResolvedDrawingDimension[],
      }
    },
  )
  const annotations = prepareDrawingAnnotations(
    page,
    preparedViews.map((prepared) => ({
      ...prepared,
      moves: prepared.explosion?.moves,
      factor:
        prepared.view instanceof AssemblyDrawingExplosionView
          ? prepared.view._parsedProps.factor
          : undefined,
    })),
  )
  const insertPage = () => {
    const { drawing_page_id } = db.drawing_page.insert({
      name: props.name,
      display_name: props.displayName,
      width: props.width,
      height: props.height,
      page_size: props.size,
      anchor_alignment: props.anchorAlignment,
      orientation: props.size ? (props.orientation ?? "landscape") : undefined,
    })
    const references = new Map<AssemblyDrawingView, ViewReference>()
    for (const {
      view,
      stage,
      explosion,
      membership,
      drawingView,
      dimensions,
    } of preparedViews) {
      let stageId = stage?.drawing_assembly_stage_id
      if (usesResolvedDrawingScene(view) && !stageId) {
        stageId = db.drawing_assembly_stage.insert({
          name:
            stage?.name ??
            `${view.name || explosion?.stage.name || "view"}-membership`,
          display_name: stage?._parsedProps.displayName,
          ...toDrawingPartSelection(membership),
        }).drawing_assembly_stage_id
        if (stage) stage.drawing_assembly_stage_id = stageId
      }
      const {
        pcb_board_ids,
        source_component_ids,
        source_group_id,
        ...viewport
      } = drawingView
      let reference: ViewReference
      if (view instanceof AssemblyDrawingExplosionView) {
        reference = {
          drawing_explosion_view_id: db.drawing_explosion_view.insert({
            ...viewport,
            drawing_page_id,
            drawing_assembly_stage_id: stageId!,
            moves: explosion!.moves,
            factor: view._parsedProps.factor,
            show_trails: view._parsedProps.showTrails,
          }).drawing_explosion_view_id,
        }
      } else {
        reference = {
          drawing_part_view_id: db.drawing_part_view.insert({
            ...viewport,
            drawing_page_id,
            ...(stageId
              ? { drawing_assembly_stage_id: stageId }
              : { source_component_ids, source_group_id }),
          }).drawing_part_view_id,
        }
      }
      references.set(view, reference)
      for (const dimension of dimensions)
        db.drawing_dimension_line.insert({ ...reference, ...dimension })
    }
    for (const { view, content } of annotations.labels)
      db.drawing_part_label.insert({ ...references.get(view)!, ...content })
    for (const { view, content } of annotations.notes)
      db.drawing_page_note.insert({
        drawing_page_id,
        ...(view ? references.get(view)! : {}),
        ...content,
      })
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
  if (
    !preparedViews.some(({ view }) =>
      view.children.some(
        (child) => child.componentName === "AssemblyDrawingDimension",
      ),
    )
  ) {
    insertPage()
    return
  }
  page._queueAsyncEffect("resolve-drawing-dimensions", async () => {
    try {
      const { resolveDrawingDimensions } = await import(
        "lib/utils/assembly-drawing/dimensions/resolve-drawing-dimensions"
      )
      for (const prepared of preparedViews)
        prepared.dimensions = await resolveDrawingDimensions(
          prepared.view,
          prepared.drawingView,
          prepared.explosion?.dimensionGeometry ?? circuitJson,
        )
      insertPage()
    } catch (error) {
      page.drawingRenderError = error
      page._markDirty("DrawingRender")
    }
  })
}
