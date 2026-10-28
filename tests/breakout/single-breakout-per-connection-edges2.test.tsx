import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("single breakout honors an edge-first busFanoutDirections entry", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="30mm" routeRemaining={false}>
      <breakout
        name="B1"
        padding="3mm"
        busFanoutDirections={{ DATA: "leftside_bottom" }}
      >
        <chip name="U1" footprint="bga16_grid4x4_p1mm" />
      </breakout>
      {/* The destinations are to the right, so only the bus direction can
          send these exits out of the left edge. */}
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={14} pcbY={1} />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={14}
        pcbY={-1}
      />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={14} pcbY={3} />
      <trace name="DATA0" from="U1.pin8" to="R1.pin1" />
      <trace name="DATA1" from="U1.pin12" to="R2.pin1" />
      <trace name="FREE" from="U1.pin16" to="R3.pin1" />
      <bus name="DATA" connections={["DATA0", "DATA1"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const breakoutGroup = circuit.db.pcb_group
    .list()
    .find((group) => group.name === "B1")!
  const minX = breakoutGroup.center.x - breakoutGroup.width! / 2
  const maxX = breakoutGroup.center.x + breakoutGroup.width! / 2
  const minY = breakoutGroup.center.y - breakoutGroup.height! / 2
  const height = breakoutGroup.height!
  const pointByTraceName = Object.fromEntries(
    circuit.db.pcb_breakout_point
      .list()
      .map((point) => [
        circuit.db.source_trace.get(point.source_trace_id!)!.name,
        point,
      ]),
  )

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  for (const name of ["DATA0", "DATA1"]) {
    const point = pointByTraceName[name]!
    expect(point.x).toBeCloseTo(minX, 2)
    expect(point.y).toBeLessThan(minY + height / 3)
  }
  expect(pointByTraceName.FREE!.x).toBeCloseTo(maxX, 2)
  expect(circuit.db.source_property_ignored_warning.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
