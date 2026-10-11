import type { AnyCircuitElement, PcbSilkscreenText } from "circuit-json"
import type { IsolatedCircuit } from "lib/IsolatedCircuit"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { Board } from "lib/components/normal-components/Board/Board"
import type { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import type { PcbSilkscreenTextId } from "lib/utils/circuit-json/circuit-json-id-types"
import { DESIGNATOR_PLACEHOLDERS } from "lib/utils/designator-placeholders"
import type { SilkscreenLabelLayer } from "lib/utils/silkscreen-label-placement/types"
import { resolveSilkscreenTextPcbSxPosition } from "lib/utils/pcbSx/resolve-silkscreen-text-pcb-sx-position"
import type { NormalComponent } from "../NormalComponent"

/**
 * Checks if the component is a part on the PCB, whose labels label placement
 * may move. Groups are normal components too, but have no pcb_component.
 */
export const isPcbPart = (
  component: PrimitiveComponent,
): component is NormalComponent<any, any> =>
  "_isNormalComponent" in component &&
  component._isNormalComponent === true &&
  component.pcb_component_id !== null

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
  return (
    silkscreenText._hasUserDefinedPcbPosition() ||
    silkscreenText._parsedProps.pcbRotation !== undefined ||
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
      .filter(isPcbPart)
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

/**
 * Returns a check for the text an isolated subcircuit render placed. Without a
 * record of the render, like for circuit JSON cached elsewhere, all of it is.
 */
export const getIsPlacedInIsolatedRender = (
  isolatedCircuitJson: AnyCircuitElement[],
) => {
  const placedPcbSilkscreenTextIds =
    placedPcbSilkscreenTextIdsByIsolatedCircuitJson.get(isolatedCircuitJson)
  return (pcbSilkscreenText: PcbSilkscreenText) =>
    placedPcbSilkscreenTextIds?.has(pcbSilkscreenText.pcb_silkscreen_text_id) ??
    true
}

/**
 * Checks if the text is a <footprint>'s designator placeholder, like the
 * {NAME} text of a footprint imported from a parts library.
 */
const isFootprintDesignatorPlaceholder = (silkscreenText: SilkscreenText) =>
  silkscreenText.parent?.componentName === "Footprint" &&
  DESIGNATOR_PLACEHOLDERS.includes(
    silkscreenText._parsedProps.text?.trim() ?? "",
  )

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
 * Unlike _getBoard, it doesn't fall back to the circuit's board, whose solver
 * only places the labels of its descendants.
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
 * Returns the labels the board's SilkscreenLabelPlacementSolver places for a
 * part on the given side, which is the part's: those getMovableSilkscreenLabels
 * returns on that side. Its other text stays where it is.
 */
export const getBoardPlacedSilkscreenLabels = (
  normalComponent: NormalComponent<any, any>,
  layer: SilkscreenLabelLayer,
): PcbSilkscreenText[] =>
  getMovableSilkscreenLabels(normalComponent).filter(
    (label) => label.layer === layer,
  )
