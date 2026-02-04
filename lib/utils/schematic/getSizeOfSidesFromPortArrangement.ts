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
  const { leftSize = 0, rightSize = 0, topSize = 0, bottomSize = 0 } = pa as any
  return { leftSize, rightSize, topSize, bottomSize }
}
