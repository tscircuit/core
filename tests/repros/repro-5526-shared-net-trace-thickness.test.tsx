import { beforeAll, expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()

beforeAll(async () => {
  circuit.add(
    <board width="30mm" height="20mm" defaultTraceWidth="0.2mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        pcbX={-10}
        pcbY={5}
      />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={10} pcbY={5} />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0603"
        pcbX={-10}
        pcbY={-5}
      />
      <resistor
        name="R4"
        resistance="1k"
        footprint="0603"
        pcbX={10}
        pcbY={-5}
      />
      <trace name="VBUS trunk" from="R1.pin2" to="R2.pin1" thickness="0.8mm" />
      <trace from="R3.pin2" to="net.VBUS" />
      <trace from="R4.pin1" to="net.VBUS" />
      <trace from="R1.pin2" to="net.VBUS" />
      <pcbnotetext pcbY={8} fontSize={0.48} text="R1 to R2: 0.8 mm" />
      <pcbnotetext
        pcbY={-8}
        fontSize={0.48}
        text="Other VBUS branches: 0.2 mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(3)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("explicit trace thickness and ownership stay on the VBUS trunk", () => {
  const trunk = circuit.db.source_trace.getWhere({ name: "VBUS trunk" })!
  const traceWidths = circuit.db.pcb_trace
    .list()
    .map((trace) => ({
      belongsToTrunk: trace.source_trace_id === trunk.source_trace_id,
      wireWidths: [
        ...new Set(
          trace.route.flatMap((point) =>
            point.route_type === "wire" ? [point.width] : [],
          ),
        ),
      ],
    }))
    .sort((a, b) => Number(b.belongsToTrunk) - Number(a.belongsToTrunk))

  expect(traceWidths).toEqual([
    { belongsToTrunk: true, wireWidths: [0.8] },
    { belongsToTrunk: false, wireWidths: [0.2] },
    { belongsToTrunk: false, wireWidths: [0.2] },
  ])
})
