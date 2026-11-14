import { selectAll } from "css-select"
import type { AssemblyDrawingSelection } from "@tscircuit/props"
import type { DrawingPartSelection, PcbBoard } from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { Board } from "lib/components/normal-components/Board/Board"
import { AssemblyDrawingStage } from "lib/components/primitive-components/AssemblyDrawingStage"
import { cssSelectPrimitiveComponentAdapter } from "lib/components/base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter"
import { preprocessSelector } from "lib/components/base-components/PrimitiveComponent/preprocessSelector"
import { getAssemblyScope } from "lib/components/primitive-components/get-assembly-scope-components"

type SourceComponentId = NonNullable<PrimitiveComponent["source_component_id"]>
type PcbBoardId = PcbBoard["pcb_board_id"]
export interface DrawingMembership extends DrawingPartSelection {
  source_component_ids: SourceComponentId[]
  pcb_board_ids: PcbBoardId[]
}

export function selectDrawingReferences(
  context: PrimitiveComponent,
  selector: string,
) {
  return selectAll(
    preprocessSelector(selector, context),
    [getAssemblyScope(context)],
    {
      adapter: cssSelectPrimitiveComponentAdapter,
    },
  ).filter((part) => !part.shouldBeRemoved)
}

export function resolveDrawingStage(
  context: PrimitiveComponent,
  selector: string,
) {
  const matches = selectDrawingReferences(context, selector).filter(
    (part): part is AssemblyDrawingStage =>
      part instanceof AssemblyDrawingStage,
  )
  if (matches.length !== 1)
    throw new Error(
      `Drawing stage reference "${selector}" must select exactly one assembly.drawing.stage`,
    )
  return matches[0]
}

/** Resolve membership only. Geometry remains in assembled right-handed CAD world
 * XYZ, +X right/+Y top/+Z above, mm; no model point or direction is transformed. */
export function resolveDrawingStageSelection(
  context: PrimitiveComponent,
  selection: AssemblyDrawingSelection,
  visiting = new Set<AssemblyDrawingStage>(),
): DrawingMembership {
  const sources = new Set<SourceComponentId>()
  const boards = new Set<PcbBoardId>()
  const drawableSources = new Set(
    context
      .root!.db.cad_component.list()
      .map((part) => part.source_component_id),
  )
  for (const ref of selection.partRefs ?? []) {
    const matches = selectDrawingReferences(context, ref)
    if (!matches.length)
      throw new Error(`Drawing part reference "${ref}" matched no parts`)
    for (const part of matches) {
      const members = [part, ...part.getDescendants()].filter(
        (member) =>
          !member.shouldBeRemoved &&
          member.source_component_id &&
          drawableSources.has(member.source_component_id),
      )
      if (!members.length)
        throw new Error(
          `Drawing part reference "${ref}" has no source geometry`,
        )
      for (const member of members) sources.add(member.source_component_id!)
    }
  }
  for (const ref of selection.boardRefs ?? []) {
    const matches = selectDrawingReferences(context, ref)
    if (
      !matches.length ||
      matches.some(
        (part) =>
          part.componentName !== "Board" || !(part as Board).pcb_board_id,
      )
    )
      throw new Error(
        `Drawing board reference "${ref}" must select rendered boards`,
      )
    for (const board of matches as Board[]) boards.add(board.pcb_board_id!)
  }
  for (const ref of selection.includeStageRefs ?? []) {
    const stage = resolveDrawingStage(context, ref)
    if (visiting.has(stage))
      throw new Error(`Drawing membership cycle at stage "${stage.name}"`)
    visiting.add(stage)
    const members = resolveDrawingStageSelection(
      stage,
      stage._parsedProps,
      visiting,
    )
    visiting.delete(stage)
    for (const source of members.source_component_ids) sources.add(source)
    for (const board of members.pcb_board_ids) boards.add(board)
  }
  if (!sources.size && !boards.size)
    throw new Error("Drawing selection has no geometry")
  return { source_component_ids: [...sources], pcb_board_ids: [...boards] }
}

/** Omit empty optional selections at the Circuit JSON boundary. */
export const toDrawingPartSelection = (
  membership: DrawingMembership,
): DrawingPartSelection => ({
  source_component_ids: membership.source_component_ids.length
    ? membership.source_component_ids
    : undefined,
  pcb_board_ids: membership.pcb_board_ids.length
    ? membership.pcb_board_ids
    : undefined,
})
