import { expect, test } from "bun:test"
import { createPcbTraceSectionIdAllocator } from "lib/components/primitive-components/Group/create-pcb-trace-section-id-allocator"

test("section IDs preserve requested logical IDs and skip reserved suffixes", () => {
  const getNextPcbTraceId = createPcbTraceSectionIdAllocator({
    existingPcbTraceIds: ["shared__section_3"],
    requestedPcbTraceIds: ["shared", "shared__section_1"],
  })

  expect([
    getNextPcbTraceId("shared"),
    getNextPcbTraceId("shared"),
    getNextPcbTraceId("shared__section_1"),
    getNextPcbTraceId("shared"),
  ]).toEqual([
    "shared",
    "shared__section_2",
    "shared__section_1",
    "shared__section_4",
  ])
})
