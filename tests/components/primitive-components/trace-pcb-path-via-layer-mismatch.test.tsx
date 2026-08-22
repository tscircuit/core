import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual pcbPath rejects a via starting on the wrong layer", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="8mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={4} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={[
          { x: 1, y: 1, via: true, fromLayer: "bottom", toLayer: "top" },
        ]}
      />
      <pcbnotetext
        pcbY={-2.5}
        anchorAlignment="center"
        fontSize={0.5}
        text="INVALID VIA DIRECTION IS REJECTED"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.pcb_trace.list().flatMap((pcbTrace) =>
      pcbTrace.route.map((routePoint) => routePoint.route_type),
    ),
  ).toEqual(["wire", "wire"])
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(1)
  expect(circuit.db.pcb_trace_error.list()[0]?.message).toContain(
    "starts on bottom, but the preceding path is on top",
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
