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
  // `${side}PinCount` is the current spelling; `${side}Size` is the deprecated
  // one (see schematicPortArrangement in @tscircuit/props, where the Size fields
  // are marked "@deprecated, use ...PinCount"). Only the deprecated form was
  // read here, so an arrangement written with the current names produced a box
  // with zero pins on every side.
  const arrangement = pa as any
  return {
    leftSize: arrangement.leftPinCount ?? arrangement.leftSize ?? 0,
    rightSize: arrangement.rightPinCount ?? arrangement.rightSize ?? 0,
    topSize: arrangement.topPinCount ?? arrangement.topSize ?? 0,
    bottomSize: arrangement.bottomPinCount ?? arrangement.bottomSize ?? 0,
  }
}
