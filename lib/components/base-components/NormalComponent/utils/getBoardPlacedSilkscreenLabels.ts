import type { AnyCircuitElement, PcbSilkscreenText } from "circuit-json"
import type { IsolatedCircuit } from "lib/IsolatedCircuit"
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
  if (silkscreenText._isPlacedInCircuitJson) return true
  const { pcbX, pcbY } = resolveSilkscreenTextPcbSxPosition(silkscreenText)
  return pcbX !== undefined || pcbY !== undefined
}

/**
 * The text an isolated subcircuit render placed, keyed by its circuit JSON,
 * which loses the pcbSx and rendered layouts that placed it.
 */
const placedPcbSilkscreenTextIdsByIsolatedCircuitJson = new WeakMap<
  AnyCircuitElement[],
  Set<PcbSilkscreenTextId>
>()

/** Records the text of an isolated subcircuit render that was placed. */
export const recordPlacedSilkscreenTextOfIsolatedRender = (
  isolatedCircuit: IsolatedCircuit,
  circuitJson: AnyCircuitElement[],
) => {
  placedPcbSilkscreenTextIdsByIsolatedCircuitJson.set(
    circuitJson,
    new Set(
      (isolatedCircuit.firstChild?.getDescendants() ?? [])
        .filter(
          (descendant): descendant is SilkscreenText =>
            descendant.componentName === "SilkscreenText",
        )
        .filter(isPlacedSilkscreenText)
        .flatMap((silkscreenText) => silkscreenText.pcb_silkscreen_text_ids),
    ),
  )
}

/** Returns a check for the text an isolated subcircuit render placed. */
export const getIsPlacedInIsolatedRender = (
  isolatedCircuitJson: AnyCircuitElement[],
) => {
  const placedPcbSilkscreenTextIds =
    placedPcbSilkscreenTextIdsByIsolatedCircuitJson.get(isolatedCircuitJson)
  return (pcbSilkscreenText: PcbSilkscreenText) =>
    placedPcbSilkscreenTextIds?.has(pcbSilkscreenText.pcb_silkscreen_text_id) ??
    false
}

const DESIGNATOR_PLACEHOLDERS = new Set(["{NAME}", "{REF}", "{REFERENCE}"])

/**
 * Checks if the text is a <footprint>'s designator placeholder, like the
 * {NAME} text of a footprint imported from a parts library.
 */
const isFootprintDesignatorPlaceholder = (silkscreenText: SilkscreenText) =>
  silkscreenText.parent?.componentName === "Footprint" &&
  DESIGNATOR_PLACEHOLDERS.has(silkscreenText._parsedProps.text?.trim() ?? "")

/**
 * Checks if the text comes from a footprint string, KiCad, a URL or the parts
 * engine, or is a <footprint>'s designator placeholder, and still sits where
 * that footprint put it.
 */
const isFootprintDefaultText = (silkscreenText: SilkscreenText) =>
  (silkscreenText._footprinterFontSize !== undefined ||
    isFootprintDesignatorPlaceholder(silkscreenText)) &&
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
