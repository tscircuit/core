export function getSourceTraceIdsFromRerouteName(value: unknown): string[] {
  if (typeof value !== "string" || value.length === 0) return []

  return value.split("__").flatMap((connectionNamePart) => {
    if (connectionNamePart.length === 0) return []

    let sourceTraceId = connectionNamePart

    const mstSegmentSuffixIndex = sourceTraceId.search(/_mst\d+_\d+$/)
    if (mstSegmentSuffixIndex > 0) {
      sourceTraceId = sourceTraceId.slice(0, mstSegmentSuffixIndex)
    }

    const sourceTraceIds = [sourceTraceId]
    const rerouteSuffixIndex = sourceTraceId.indexOf("_reroute_")
    if (rerouteSuffixIndex > 0) {
      sourceTraceIds.push(sourceTraceId.slice(0, rerouteSuffixIndex))
    }

    return sourceTraceIds
  })
}
