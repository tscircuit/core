import { expect, test } from "bun:test"
import { computeJunctions } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/compute-junctions"

test("does not create junctions where traces from different nets touch", () => {
  const junctions = computeJunctions([
    {
      source_trace_id: "cc2_trace",
      connectivity_key: "net.CC2",
      edges: [
        {
          from: { x: 0, y: 0 },
          to: { x: 0, y: 2 },
        },
      ],
    },
    {
      source_trace_id: "ground_trace",
      connectivity_key: "net.GND",
      edges: [
        {
          from: { x: -1, y: 1 },
          to: { x: 0, y: 1 },
        },
        {
          from: { x: 0, y: 1 },
          to: { x: 1, y: 1 },
        },
      ],
    },
  ])

  expect(junctions).toEqual({
    cc2_trace: [],
    ground_trace: [],
  })
})

test("still creates junctions where traces from the same net touch", () => {
  const junctions = computeJunctions([
    {
      source_trace_id: "first_ground_trace",
      connectivity_key: "net.GND",
      edges: [
        {
          from: { x: 0, y: 0 },
          to: { x: 0, y: 2 },
        },
      ],
    },
    {
      source_trace_id: "second_ground_trace",
      connectivity_key: "net.GND",
      edges: [
        {
          from: { x: -1, y: 1 },
          to: { x: 0, y: 1 },
        },
        {
          from: { x: 0, y: 1 },
          to: { x: 1, y: 1 },
        },
      ],
    },
  ])

  expect(junctions).toEqual({
    first_ground_trace: [{ x: 0, y: 1 }],
    second_ground_trace: [{ x: 0, y: 1 }],
  })
})
