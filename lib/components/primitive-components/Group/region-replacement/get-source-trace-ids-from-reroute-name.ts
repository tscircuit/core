export function getSourceTraceIdsFromRerouteName(value: unknown): string[] {
  if (typeof value !== "string" || value.length === 0) return []

  return value.split("__").flatMap((connectionNamePart) => {
    if (connectionNamePart.length === 0) return []

    const sourceTraceIds = [connectionNamePart]
    const rerouteSuffixIndex = connectionNamePart.indexOf("_reroute_")
    if (rerouteSuffixIndex > 0) {
      sourceTraceIds.push(connectionNamePart.slice(0, rerouteSuffixIndex))
    }

    return sourceTraceIds
  })
}
