import { Port } from "lib/components/primitive-components/Port"

export const canMergePortDefinitions = (a: Port, b: Port): boolean => {
  const aPinNumber = a._parsedProps.pinNumber
  const bPinNumber = b._parsedProps.pinNumber

  if (
    aPinNumber !== undefined &&
    bPinNumber !== undefined &&
    aPinNumber !== bPinNumber
  ) {
    return false
  }

  return a.isMatchingAnyOf(b.getNameAndAliases())
}
