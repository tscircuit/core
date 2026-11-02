import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const SegmentedFootprint = () => (
  <footprint>
    <smtpad portHints={["1"]} pcbX={-1} width={0.6} height={0.4} shape="rect" />
    <smtpad portHints={["2"]} pcbX={1} width={0.6} height={0.4} shape="rect" />
    {[
      [
        { x: -1.5, y: 0.5 },
        { x: 1.5, y: 0.5 },
      ],
      [
        { x: -1.5, y: -0.5 },
        { x: 1.5, y: -0.5 },
      ],
      [
        { x: -1.5, y: -0.5 },
        { x: -1.5, y: 0.5 },
      ],
      [
        { x: 1.5, y: 0.5 },
        { x: 1.5, y: -0.5 },
      ],
    ].map((outline, edgeIndex) => (
      <Fragment key={edgeIndex}>
        <courtyardoutline outline={outline} layer="top" />
      </Fragment>
    ))}
  </footprint>
)

test("stitched courtyard segments still detect overlap when copper pads are clear", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="8mm" height="5mm" routingDisabled>
      <chip name="U1" pcbY={-0.375} footprint={<SegmentedFootprint />} />
      <chip name="U2" pcbY={0.375} footprint={<SegmentedFootprint />} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.pcb_courtyard_outline
      .list()
      .map((courtyard) => courtyard.outline.length),
  ).toEqual([4, 4])
  expect(circuit.db.pcb_footprint_overlap_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_courtyard_overlap_error.list().length).toBeGreaterThan(
    0,
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
    showCourtyards: true,
  })
})
