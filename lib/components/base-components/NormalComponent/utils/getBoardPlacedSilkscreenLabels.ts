import type { PcbSilkscreenText } from "circuit-json"
import type { Board } from "lib/components/normal-components/Board/Board"
import type { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import type { PcbSilkscreenTextId } from "lib/utils/circuit-json/circuit-json-id-types"
import { resolveSilkscreenTextPcbSxPosition } from "lib/utils/pcbSx/resolve-silkscreen-text-pcb-sx-position"
import type { NormalComponent } from "../NormalComponent"

/**
 * Checks if the text was placed by hand (a pcbSx position) or by a rendered
 * layout, so no label placement moves it.
 */
const isPlacedSilkscreenText = (silkscreenText: SilkscreenText) => {
  if (silkscreenText._isFromRenderedLayout) return true
  const { pcbX, pcbY } = resolveSilkscreenTextPcbSxPosition(silkscreenText)
  return pcbX !== undefined || pcbY !== undefined
}

/**
 * Checks if the text comes from a footprint string, KiCad, a URL or the parts
 * engine and still sits where that footprint put it.
 */
const isFootprintDefaultText = (silkscreenText: SilkscreenText) =>
  silkscreenText._footprinterFontSize !== undefined &&
  !isPlacedSilkscreenText(silkscreenText)

/** Returns the ids of the component's text that no label placement moves. */
export const getPlacedSilkscreenTextIds = (
  normalComponent: NormalComponent<any, any>,
): Set<PcbSilkscreenTextId> =>
  new Set(
    normalComponent
      .selectAll<SilkscreenText>("silkscreentext")
      .filter(isPlacedSilkscreenText)
      .flatMap((silkscreenText) => silkscreenText.pcb_silkscreen_text_ids),
  )

/**
 * Returns the <board> whose label placement solver places the component's
 * labels, or null for components on a mounted board or outside every board.
 */
export const getSilkscreenLabelPlacingBoard = (
  normalComponent: NormalComponent<any, any>,
): Board | null => {
  for (
    let ancestor = normalComponent.parent;
    ancestor;
    ancestor = ancestor.parent
  ) {
    if (ancestor.componentName === "MountedBoard") return null
    if (ancestor.componentName === "Board") return ancestor as Board
  }
  return null
}

/**
 * Returns the labels placed by the board's SilkscreenLabelPlacementSolvers:
 * footprint text matching the name of a component inside a <board>, on the
 * component's side. NormalComponent_doInitialSilkscreenOverlapAdjustment
 * handles the other labels.
 */
export const getBoardPlacedSilkscreenLabels = (
  normalComponent: NormalComponent<any, any>,
): PcbSilkscreenText[] => {
  const { pcb_component_id } = normalComponent
  if (!pcb_component_id || !getSilkscreenLabelPlacingBoard(normalComponent))
    return []
  const { db } = normalComponent.root!
  const layer = db.pcb_component.get(pcb_component_id)?.layer
  if (layer !== "top" && layer !== "bottom") return []
  return normalComponent
    .selectAll<SilkscreenText>("silkscreentext")
    .filter(isFootprintDefaultText)
    .flatMap((silkscreenText) => silkscreenText.pcb_silkscreen_text_ids)
    .map((pcbSilkscreenTextId) =>
      db.pcb_silkscreen_text.get(pcbSilkscreenTextId),
    )
    .filter(
      (pcbSilkscreenText): pcbSilkscreenText is PcbSilkscreenText =>
        pcbSilkscreenText?.layer === layer &&
        pcbSilkscreenText.text === normalComponent.name,
    )
}
