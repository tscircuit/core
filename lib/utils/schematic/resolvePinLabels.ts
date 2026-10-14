import type { PinLabelsProp } from "@tscircuit/props"
import { getPinNumberFromPinLabelsKey } from "./getPinNumberFromPinLabelsKey"

export const isPhysicalPinName = (name: string): boolean =>
  /^[A-Z]+[1-9]\d*$/.test(name)

export interface ResolvedPinLabel {
  pinNumber: number
  physicalPinName?: string
  labels: string[]
}

/**
 * Preserve numeric pins and assign schematic ordinals to physical package names.
 * The complete explicit pin map is the package mapping: rows sort by length then
 * ASCII (Z before AA), columns numerically. Object/footprint order is irrelevant.
 * Existing numeric ordinals are reserved. Physical names remain separate from
 * these layout ordinals and must be serialized as port names and pad hints.
 */
export function resolvePinLabels(pinLabels: PinLabelsProp): ResolvedPinLabel[] {
  const usedPinNumbers = new Set(
    Object.keys(pinLabels).flatMap((key) => {
      const pinNumber = getPinNumberFromPinLabelsKey(key)
      return pinNumber === null ? [] : [pinNumber]
    }),
  )
  const physicalNames = Object.keys(pinLabels)
    .filter(isPhysicalPinName)
    .sort((a, b) => {
      const [, rowA, columnA] = a.match(/^([A-Z]+)(\d+)$/)!
      const [, rowB, columnB] = b.match(/^([A-Z]+)(\d+)$/)!
      return (
        rowA.length - rowB.length ||
        (rowA < rowB ? -1 : rowA > rowB ? 1 : 0) ||
        Number(columnA) - Number(columnB)
      )
    })
  const physicalPins: Array<{ physicalPinName: string; pinNumber: number }> = []
  let nextPinNumber = 1
  for (const name of physicalNames) {
    while (usedPinNumbers.has(nextPinNumber)) nextPinNumber++
    physicalPins.push({ physicalPinName: name, pinNumber: nextPinNumber++ })
  }
  return Object.entries(pinLabels).map(([key, labels]) => {
    const numericPinNumber = getPinNumberFromPinLabelsKey(key)
    const pinNumber =
      numericPinNumber ??
      physicalPins.find((pin) => pin.physicalPinName === key)?.pinNumber
    if (pinNumber === undefined) {
      throw new Error(
        `Invalid pinLabels key "${key}". Expected a numeric pin (e.g. pin1) or physical ball name (e.g. A1).`,
      )
    }
    return {
      pinNumber,
      physicalPinName: numericPinNumber === null ? key : undefined,
      labels: typeof labels === "string" ? [labels] : [...labels],
    }
  })
}

export function getNumericPinLabels(
  pinLabels: PinLabelsProp,
): Record<string, string | string[]> {
  if (!Object.keys(pinLabels).some(isPhysicalPinName)) {
    return Object.fromEntries(
      Object.entries(pinLabels).map(([key, labels]) => [
        key,
        typeof labels === "string" ? labels : [...labels],
      ]),
    )
  }
  return Object.fromEntries(
    resolvePinLabels(pinLabels).map(
      ({ pinNumber, physicalPinName, labels }) => [
        `pin${pinNumber}`,
        physicalPinName ? [...labels, physicalPinName] : labels,
      ],
    ),
  )
}
