import type {
  ExplicitPinMappingArrangement,
  PortArrangement,
} from "./getAllDimensionsForSchematicBox"
import { getPinsFromSideDefinition } from "./normalizePinSideDefinition"

export const hasExplicitPinMapping = (
  pa: PortArrangement,
): pa is ExplicitPinMappingArrangement => {
  for (const side of [
    "leftSide",
    "rightSide",
    "topSide",
    "bottomSide",
  ] as const) {
    if (side in pa && typeof (pa as any)[side] === "number") {
      throw new Error(
        `A number was specified for "${side}", you probably meant to use "size" not "side"`,
      )
    }
  }
  return (
    "leftSide" in pa ||
    "rightSide" in pa ||
    "topSide" in pa ||
    "bottomSide" in pa
  )
}

export const getPinsFromPortArrangement = (
  pa: PortArrangement | null | undefined,
): (number | string)[] => {
  if (!pa || !hasExplicitPinMapping(pa)) return []

  return [
    ...getPinsFromSideDefinition(pa.leftSide),
    ...getPinsFromSideDefinition(pa.rightSide),
    ...getPinsFromSideDefinition(pa.topSide),
    ...getPinsFromSideDefinition(pa.bottomSide),
  ]
}

export const getSizeOfSidesFromPortArrangement = (
  pa: PortArrangement,
): {
  leftSize: number
  rightSize: number
  topSize: number
  bottomSize: number
} => {
  if (hasExplicitPinMapping(pa)) {
    return {
      leftSize: getPinsFromSideDefinition(pa.leftSide).length,
      rightSize: getPinsFromSideDefinition(pa.rightSide).length,
      topSize: getPinsFromSideDefinition(pa.topSide).length,
      bottomSize: getPinsFromSideDefinition(pa.bottomSide).length,
    }
  }
  const leftSize = (pa as any).leftPinCount ?? (pa as any).leftSize ?? 0
  const rightSize = (pa as any).rightPinCount ?? (pa as any).rightSize ?? 0
  const topSize = (pa as any).topPinCount ?? (pa as any).topSize ?? 0
  const bottomSize = (pa as any).bottomPinCount ?? (pa as any).bottomSize ?? 0
  return { leftSize, rightSize, topSize, bottomSize }
}
