import type { PcbTrace } from "circuit-json"

export type PcbTraceId = PcbTrace["pcb_trace_id"]

export const createPcbTraceSectionIdAllocator = ({
  existingPcbTraceIds,
  requestedPcbTraceIds,
}: {
  existingPcbTraceIds: readonly PcbTraceId[]
  requestedPcbTraceIds: readonly PcbTraceId[]
}) => {
  const reservedPcbTraceIds = new Set(existingPcbTraceIds)
  const requestedLogicalPcbTraceIds = new Set(requestedPcbTraceIds)
  const nextSectionIndexByPcbTraceId = new Map<PcbTraceId, number>()

  return (requestedPcbTraceId: PcbTraceId): PcbTraceId => {
    if (!reservedPcbTraceIds.has(requestedPcbTraceId)) {
      reservedPcbTraceIds.add(requestedPcbTraceId)
      return requestedPcbTraceId
    }

    let sectionIndex =
      nextSectionIndexByPcbTraceId.get(requestedPcbTraceId) ?? 1
    let candidatePcbTraceId = `${requestedPcbTraceId}__section_${sectionIndex}`
    while (
      reservedPcbTraceIds.has(candidatePcbTraceId) ||
      requestedLogicalPcbTraceIds.has(candidatePcbTraceId)
    ) {
      sectionIndex++
      candidatePcbTraceId = `${requestedPcbTraceId}__section_${sectionIndex}`
    }
    nextSectionIndexByPcbTraceId.set(requestedPcbTraceId, sectionIndex + 1)
    reservedPcbTraceIds.add(candidatePcbTraceId)
    return candidatePcbTraceId
  }
}
