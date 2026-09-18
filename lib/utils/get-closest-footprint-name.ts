const normalizeFootprintName = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "")

const sortCharacters = (value: string): string =>
  value.split("").sort().join("")

const getEditDistance = (a: string, b: string): number => {
  const rows = a.length + 1
  const cols = b.length + 1
  const distances = Array.from({ length: rows }, () => new Array(cols).fill(0))
  for (let i = 0; i < rows; i++) distances[i][0] = i
  for (let j = 0; j < cols; j++) distances[0][j] = j
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      distances[i][j] = Math.min(
        distances[i - 1][j] + 1,
        distances[i][j - 1] + 1,
        distances[i - 1][j - 1] + cost,
      )
    }
  }
  return distances[a.length][b.length]
}

/**
 * Find the footprint name that most closely matches a mistyped footprint
 * string. Separators and word order are ignored, so "slide_switch_smd"
 * resolves to "smdslideswitch". Returns null when no candidate is close
 * enough to be a useful suggestion.
 */
export const getClosestFootprintName = (
  footprint: string,
  footprintNames: string[],
): string | null => {
  const normalizedInput = normalizeFootprintName(footprint)
  if (!normalizedInput) return null

  let closestName: string | null = null
  let closestScore = Infinity
  for (const name of footprintNames) {
    const normalizedName = normalizeFootprintName(name)
    const score = Math.min(
      getEditDistance(normalizedInput, normalizedName),
      getEditDistance(
        sortCharacters(normalizedInput),
        sortCharacters(normalizedName),
      ),
    )
    if (score < closestScore) {
      closestScore = score
      closestName = name
    }
  }

  const maxScore = Math.max(1, Math.floor(normalizedInput.length * 0.4))
  return closestScore <= maxScore ? closestName : null
}
