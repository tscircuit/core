import { expect, test } from "bun:test"
import type { PcbCourtyardOutline } from "circuit-json"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("legacy courtyard segments join into closed polygons without changing layers or input", () => {
  const { circuit } = getTestFixture()
  const corners = [
    { x: -2, y: -1 },
    { x: 2, y: -1 },
    { x: 2, y: 1 },
    { x: -2, y: 1 },
  ]
  const records: PcbCourtyardOutline[] = []
  for (const layer of ["top", "bottom"] as const) {
    // Deliberately interleave shuffled, reversed edges with identical coordinates
    // on the other layer. They must become two polygons, never one mixed loop.
    for (const [from, to] of [
      [0, 1],
      [3, 2],
      [0, 3],
      [2, 1],
    ]) {
      records.push({
        type: "pcb_courtyard_outline",
        pcb_courtyard_outline_id: `courtyard_${records.length}`,
        pcb_component_id: "imported_chip",
        layer,
        outline: [corners[from], corners[to]],
      })
    }
  }
  const interleaved = [0, 4, 1, 5, 2, 6, 3, 7].map((index) => records[index])
  const original = structuredClone(interleaved)
  const options = { componentName: "U1", componentRotation: "0" }
  const footprint = new Footprint({})
  footprint.addAll(createComponentsFromCircuitJson(options, interleaved))
  expect(interleaved).toEqual(original)
  expect(() =>
    createComponentsFromCircuitJson(options, records.slice(0, 2)),
  ).toThrow(/disconnected line segments/)
  circuit.add(
    <board width="8mm" height="6mm">
      <chip name="U1" />
      <pcbnotetext text="U1: joined courtyard edges" pcbY={2} fontSize={0.3} />
    </board>,
  )
  circuit.selectOne("chip")!.add(footprint)
  circuit.render()
  const outlines = circuit.db.pcb_courtyard_outline.list()
  expect(outlines).toHaveLength(2)
  expect(outlines.map((outline) => outline.layer).sort()).toEqual([
    "bottom",
    "top",
  ])
  for (const outline of outlines) {
    expect(outline.outline).toHaveLength(4)
    for (const corner of corners) expect(outline.outline).toContainEqual(corner)
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showCourtyards: true })
})
