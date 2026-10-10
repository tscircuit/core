import type { AnyCircuitElement, PcbSilkscreenText } from "circuit-json"
import type { IsolatedCircuit } from "lib/IsolatedCircuit"
import type { Board } from "lib/components/normal-components/Board/Board"
import type { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import type { PcbSilkscreenTextId } from "lib/utils/circuit-json/circuit-json-id-types"
import { resolveSilkscreenTextPcbSxPosition } from "lib/utils/pcbSx/resolve-silkscreen-text-pcb-sx-position"
import type { NormalComponent } from "../NormalComponent"

/**
 * Checks if something placed the text, so no label placement moves it. Mirrors
 * where SilkscreenText puts it: placed in circuit JSON, by a pcbSx position on
 * footprint text (the only text pcbSx moves), or by a position, rotation or
 * manual edit on text written on the part. A <footprint>'s text sits where the
 * footprint puts it.
 */
const isPlacedSilkscreenText = (silkscreenText: SilkscreenText) => {
  if (silkscreenText._isPlacedInCircuitJson) return true
  if (silkscreenText._footprinterFontSize !== undefined) {
    const { pcbX, pcbY } = resolveSilkscreenTextPcbSxPosition(silkscreenText)
    return pcbX !== undefined || pcbY !== undefined
  }
  if (silkscreenText.parent?.componentName === "Footprint") return false
  const { pcbRotation } = silkscreenText._parsedProps
  return (
    silkscreenText._hasUserDefinedPcbPosition() ||
    (pcbRotation !== undefined && pcbRotation !== 0) ||
    silkscreenText
      .getSubcircuit()
      ._getPcbManualPlacementForComponent(silkscreenText) !== null
  )
}

/**
 * The text of an isolated subcircuit render that no label placement may move,
 * keyed by its circuit JSON, which loses why.
 */
const placedPcbSilkscreenTextIdsByIsolatedCircuitJson = new WeakMap<
  AnyCircuitElement[],
  Set<PcbSilkscreenTextId>
>()

/**
 * Records the text of an isolated subcircuit render that no label placement
 * may move: all of it but the labels getMovableSilkscreenLabels returns.
 */
export const recordPlacedSilkscreenTextOfIsolatedRender = (
  isolatedCircuit: IsolatedCircuit,
  circuitJson: AnyCircuitElement[],
) => {
  const descendants = isolatedCircuit.firstChild?.getDescendants() ?? []
  const movablePcbSilkscreenTextIds = new Set(
    descendants
      .filter(
        (descendant): descendant is NormalComponent<any, any> =>
          "_isNormalComponent" in descendant &&
          descendant._isNormalComponent === true,
      )
      .flatMap(getMovableSilkscreenLabels)
      .map((label) => label.pcb_silkscreen_text_id),
  )
  placedPcbSilkscreenTextIdsByIsolatedCircuitJson.set(
    circuitJson,
    new Set(
      descendants
        .filter(
          (descendant): descendant is SilkscreenText =>
            descendant.componentName === "SilkscreenText",
        )
        .flatMap((silkscreenText) => silkscreenText.pcb_silkscreen_text_ids)
        .filter(
          (pcbSilkscreenTextId) =>
            !movablePcbSilkscreenTextIds.has(pcbSilkscreenTextId),
        ),
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
 * engine, or is a <footprint>'s designator placeholder.
 */
const isFootprintText = (silkscreenText: SilkscreenText) =>
  silkscreenText._footprinterFontSize !== undefined ||
  isFootprintDesignatorPlaceholder(silkscreenText)

/**
 * Checks if the text is a label written on the part itself, like its function
 * name, printed on one side. Unless placed, it is placed like a designator; a
 * position or rotation keeps it where it is, on the part's body for instance.
 */
const isPartLabel = (
  silkscreenText: SilkscreenText,
  normalComponent: NormalComponent<any, any>,
) =>
  silkscreenText.parent === normalComponent &&
  silkscreenText._footprinterFontSize === undefined &&
  silkscreenText.pcb_silkscreen_text_ids.length === 1

/**
 * Returns the component's labels that label placement may move, unless
 * something placed them: its footprint text matching its name, and the labels
 * written on it.
 */
const getMovableSilkscreenLabels = (
  normalComponent: NormalComponent<any, any>,
): PcbSilkscreenText[] => {
  const { db } = normalComponent.root!
  const getPcbSilkscreenTexts = (silkscreenText: SilkscreenText) =>
    silkscreenText.pcb_silkscreen_text_ids.flatMap(
      (pcbSilkscreenTextId) =>
        db.pcb_silkscreen_text.get(pcbSilkscreenTextId) ?? [],
    )
  const unplacedTexts = normalComponent
    .selectAll<SilkscreenText>("silkscreentext")
    .filter((silkscreenText) => !isPlacedSilkscreenText(silkscreenText))
  const designators = unplacedTexts
    .filter(isFootprintText)
    .flatMap(getPcbSilkscreenTexts)
    .filter((text) => text.text === normalComponent.name)
  const partLabels = unplacedTexts
    .filter((silkscreenText) => isPartLabel(silkscreenText, normalComponent))
    .flatMap(getPcbSilkscreenTexts)
  return [...designators, ...partLabels]
}

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
 * those getMovableSilkscreenLabels returns for a component inside a <board>,
 * on the component's side. NormalComponent_doInitialSilkscreenOverlapAdjustment
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
  return getMovableSilkscreenLabels(normalComponent).filter(
    (label) => label.layer === layer,
  )
}
