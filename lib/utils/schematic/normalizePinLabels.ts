/**
 * Normalizes pin labels such that they are unique while preserving numbering
 * where not confusing.
 *
 * Example input:
 * [
 *   ["1", "GND"],
 *   ["2", "GND"],
 *   ["3", "VCC"],
 *   ["3"],
 *   ["4"]
 * ]
 *
 * Example output:
 * [
 *   ["pin1", "GND1"],
 *   ["pin2", "GND2"],
 *   ["pin3", "VCC"],
 *   ["pin5", "pin3_alt1"],
 *   ["pin4"]
 * ]
 */
export const normalizePinLabels = (inputPinLabels: string[][]): string[][] => {
  // Remove duplicates inside input
  const unqInputPinLabels = inputPinLabels.map((labels) => [...new Set(labels)])

  const result: string[][] = unqInputPinLabels.map(() => [])

  /**
   * If the set has a desired number inside of it, we'll put that number in this
   * array without reference to other sets
   */
  const desiredNumbers: (number | null)[] = unqInputPinLabels.map(() => null)
  for (let i = 0; i < unqInputPinLabels.length; i++) {
    for (const label of unqInputPinLabels[i]) {
      if (/^\d+$/.test(label)) {
        desiredNumbers[i] = Number.parseInt(label)
        break
      }
    }
  }

  /**
   * Where a set desires a number, if that number isn't taken, assign it the
   * number. If it is taken, assign it an "alt" prefix
   */
  let highestPinNumber = 0
  const alreadyAcceptedDesiredNumbers: Set<number> = new Set()
  for (let i = 0; i < desiredNumbers.length; i++) {
    const desiredNumber = desiredNumbers[i]

    if (desiredNumber === null || desiredNumber < 1) {
      continue
    }

    if (!alreadyAcceptedDesiredNumbers.has(desiredNumber)) {
      alreadyAcceptedDesiredNumbers.add(desiredNumber)
      result[i].push(`pin${desiredNumber}`)
      highestPinNumber = Math.max(highestPinNumber, desiredNumber)
      continue
    }

    let existingAltsForPin = 0
    for (const label of result[i]) {
      if (label.startsWith(`pin${desiredNumber}_alt`)) {
        existingAltsForPin++
      }
    }

    result[i].push(`pin${desiredNumber}_alt${existingAltsForPin + 1}`)
  }

  // Assign pin numbers to alternate labels
  for (let i = 0; i < result.length; i++) {
    const firstLabel = result[i][0]
    if (firstLabel?.includes("_alt")) {
      highestPinNumber++
      result[i].unshift(`pin${highestPinNumber}`)
    }
  }

  // Assign pin numbers to unlabeled pins
  for (let i = 0; i < result.length; i++) {
    if (result[i].length === 0) {
      highestPinNumber++
      result[i].push(`pin${highestPinNumber}`)
    }
  }

  /**
   * Number of items that have a given label, not including pin number
   * designations
   */
  const totalLabelCounts: Record<string, number> = {}
  for (const inputLabels of unqInputPinLabels) {
    for (const label of inputLabels) {
      if (/^\d+$/.test(label)) {
        continue
      }

      totalLabelCounts[label] = (totalLabelCounts[label] ?? 0) + 1
    }
  }

  const incrementalLabelCounts: Record<string, number> = {}
  for (let i = 0; i < unqInputPinLabels.length; i++) {
    const inputLabels = unqInputPinLabels[i]
    for (const label of inputLabels) {
      if (/^\d+$/.test(label)) {
        continue
      }

      if (totalLabelCounts[label] === 1) {
        result[i].push(label)
      } else {
        incrementalLabelCounts[label] = (incrementalLabelCounts[label] ?? 0) + 1
        result[i].push(`${label}${incrementalLabelCounts[label]}`)
      }
    }
  }

  return result
}
