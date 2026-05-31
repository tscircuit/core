export interface ParsedSpiceSubckt {
  modelName: string
  pinNames: string[]
}

export function parseSpiceSubckt(source: string): ParsedSpiceSubckt | null {
  const subcktLine = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^\.subckt\b/i.test(line))

  if (!subcktLine) return null

  const tokens = subcktLine.split(/\s+/)
  const modelName = tokens[1]
  const pinNames = tokens.slice(2)

  if (!modelName || pinNames.length === 0) return null

  return { modelName, pinNames }
}
