import {
  getBoundsOfPcbElements,
  getPcbElementBounds,
} from "@tscircuit/circuit-json-util"
import type {
  AnyCircuitElement,
  PcbSilkscreenText,
  PcbSmtPad,
} from "circuit-json"
import { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"

type PcbPortHint = NonNullable<PcbSmtPad["port_hints"]>[number]

const PIN_LABEL_PAD_GAP_MM = 0.6
const PIN_LABEL_FONT_SIZE_MM = 0.7

/**
 * Input pad bounds and output label anchors are footprint-local points in mm,
 * +X right and +Y up in the right-handed PCB frame. The parent transforms both.
 */
export const createImportedFootprintPinLabels = ({
  circuitJson,
  pcbPinLabels,
}: {
  circuitJson: AnyCircuitElement[]
  pcbPinLabels?: Record<string, string>
}) => {
  if (!pcbPinLabels) return []
  const labelEntries = Object.entries(pcbPinLabels).filter(
    ([, text]) => text.length > 0,
  )
  if (labelEntries.length === 0) return []

  const pads = circuitJson.filter(
    (elm) => elm.type === "pcb_smtpad" || elm.type === "pcb_plated_hole",
  )
  if (pads.length === 0) return []

  const padsByPortHint = new Map<PcbPortHint, (typeof pads)[number]>()
  if (labelEntries.length === 1) {
    const [pinName] = labelEntries[0]
    const pad = pads.find((pad) => pad.port_hints?.includes(pinName))
    if (pad) padsByPortHint.set(pinName, pad)
  } else {
    for (const pad of pads) {
      for (const portHint of pad.port_hints ?? []) {
        if (
          Object.hasOwn(pcbPinLabels, portHint) &&
          !padsByPortHint.has(portHint)
        ) {
          padsByPortHint.set(portHint, pad)
        }
      }
    }
  }
  if (padsByPortHint.size === 0) return []

  const footprintPadBounds = getBoundsOfPcbElements(pads)
  const footprintBounds = getBoundsOfPcbElements([
    ...pads,
    ...circuitJson.filter(
      (elm) =>
        elm.type === "pcb_courtyard_outline" ||
        elm.type === "pcb_courtyard_rect" ||
        elm.type === "pcb_courtyard_circle",
    ),
  ])
  const labels: SilkscreenText[] = []

  for (const [pinName, text] of labelEntries) {
    const pad = padsByPortHint.get(pinName)
    if (!pad) continue
    const padBounds = getPcbElementBounds(pad)
    if (!padBounds) continue

    const padCenterX = (padBounds.minX + padBounds.maxX) / 2
    const padCenterY = (padBounds.minY + padBounds.maxY) / 2
    let distanceToEdge = padBounds.minY - footprintPadBounds.minY
    let pcbX = padCenterX
    let pcbY = footprintBounds.minY - PIN_LABEL_PAD_GAP_MM
    let anchorAlignment: PcbSilkscreenText["anchor_alignment"] = "top_center"

    const distanceToTop = footprintPadBounds.maxY - padBounds.maxY
    if (distanceToTop < distanceToEdge) {
      distanceToEdge = distanceToTop
      pcbY = footprintBounds.maxY + PIN_LABEL_PAD_GAP_MM
      anchorAlignment = "bottom_center"
    }

    const distanceToLeft = padBounds.minX - footprintPadBounds.minX
    if (distanceToLeft < distanceToEdge) {
      distanceToEdge = distanceToLeft
      pcbX = footprintBounds.minX - PIN_LABEL_PAD_GAP_MM
      pcbY = padCenterY
      anchorAlignment = "center_right"
    }

    const distanceToRight = footprintPadBounds.maxX - padBounds.maxX
    if (distanceToRight < distanceToEdge) {
      pcbX = footprintBounds.maxX + PIN_LABEL_PAD_GAP_MM
      pcbY = padCenterY
      anchorAlignment = "center_left"
    }

    const label = new SilkscreenText({
      text,
      pcbX,
      pcbY,
      anchorAlignment,
    })
    label._footprinterFontSize = PIN_LABEL_FONT_SIZE_MM
    labels.push(label)
  }

  return labels
}
