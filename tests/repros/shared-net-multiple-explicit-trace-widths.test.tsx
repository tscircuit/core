import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("two explicit VBUS paths keep their individual widths alongside the net nominal width", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="22mm">
      <net name="VBUS" nominalTraceWidth="0.5mm" />
      <resistor
        name="R1"
        resistance="1k"
        footprint="1206"
        pcbX={-10}
        pcbY={7}
      />
      <resistor name="R2" resistance="1k" footprint="1206" pcbX={10} pcbY={7} />
      <resistor
        name="R3"
        resistance="1k"
        footprint="1206"
        pcbX={-10}
        pcbY={0}
      />
      <resistor name="R4" resistance="1k" footprint="1206" pcbX={10} pcbY={0} />
      <resistor
        name="R5"
        resistance="1k"
        footprint="1206"
        pcbX={-10}
        pcbY={-7}
      />
      <resistor
        name="R6"
        resistance="1k"
        footprint="1206"
        pcbX={10}
        pcbY={-7}
      />
      <trace name="R3 to R4" from="R3.pin2" to="R4.pin1" thickness="0.35mm" />
      <trace name="R1 to R2" from="R1.pin2" to="R2.pin1" thickness="0.8mm" />
      <trace from="R1.pin2" to="net.VBUS" />
      <trace from="R3.pin2" to="net.VBUS" />
      <trace from="R5.pin2" to="net.VBUS" />
      <trace from="R6.pin1" to="net.VBUS" />
      <pcbnotetext pcbY={9.5} fontSize={0.48} text="R1 to R2: 0.8 mm" />
      <pcbnotetext pcbY={2.5} fontSize={0.48} text="R3 to R4: 0.35 mm" />
      <pcbnotetext
        pcbY={-9.5}
        fontSize={0.48}
        text="Other VBUS branches: 0.5 mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_port_not_connected_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const routedWidths = circuit.db.pcb_trace.list().map((trace) => ({
    owner:
      circuit.db.source_trace.get(trace.source_trace_id!)?.name ??
      circuit.db.source_net.get(trace.source_trace_id!)?.name,
    widths: [
      ...new Set(
        trace.route.flatMap((point) =>
          point.route_type === "wire" ? [point.width] : [],
        ),
      ),
    ],
  }))
  expect(routedWidths).toHaveLength(5)
  expect(routedWidths.filter((trace) => trace.owner === "R1 to R2")).toEqual([
    { owner: "R1 to R2", widths: [0.8] },
  ])
  expect(routedWidths.filter((trace) => trace.owner === "R3 to R4")).toEqual([
    { owner: "R3 to R4", widths: [0.35] },
  ])
  expect(routedWidths.filter((trace) => trace.owner === "VBUS")).toEqual(
    Array.from({ length: 3 }, () => ({ owner: "VBUS", widths: [0.5] })),
  )
})
