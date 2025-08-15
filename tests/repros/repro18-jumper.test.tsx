import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("Jumper internally connected pins mix up between different Jumper components", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <jumper
        name="JP6"
        pinLabels={{
          pin1: ["GND"],
          pin2: ["VOUT"],
        }}
        footprint="pinrow2_p2.54_id1.016_od1.88_nosquareplating_pinlabeltextalignleft_pinlabelorthogonal"
        pcbX={-2}
        pcbY={2}
        pcbRotation={90}
        schY={0.2}
        schX={-3}
      />
      <resistor
        resistance="4.7k"
        name="R1"
        pcbRotation={270}
        pcbY={2}
        pcbX={3}
        footprint="0603"
        schY={1}
        schX={2}
        schRotation={90}
      />
      <trace from=".R1 > .pin1" to=".JP6 > .pin1" />
      <trace from=".SJ1 > .pin2" to=".JP6 > .pin1" />
      <trace from=".R1 > .pin2" to=".JP6 > .pin2" />
      <solderjumper
        cadModel={null}
        name="SJ1"
        pinCount={3}
        bridgedPins={[
          ["1", "2"],
          ["2", "3"],
        ]}
        footprint="solderjumper3_bridged123_p0.8_pw0.635_ph1.270"
        pcbX="0"
        pcbY="-3"
        layer="bottom"
        schY={2}
        schX={2.5}
        schRotation={180}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((e) => e.type.includes("error"))
  console.log(circuitJson.filter((e) => e.type.includes("source_trace")))
  console.log(circuitJson.filter((e) => e.type.includes("pcb_trace")))
  console.log(circuitJson.filter((e) => e.type.includes("source_net")))
  expect(errors).toMatchInlineSnapshot(`
    [
      {
        "error_type": "pcb_port_not_connected_error",
        "message": "pcb_port_not_connected_error: Pcb ports [pcb_port_3, pcb_port_1] are not connected together through the same net.",
        "pcb_component_ids": [
          "pcb_component_1",
          "pcb_component_0",
        ],
        "pcb_port_ids": [
          "pcb_port_3",
          "pcb_port_1",
        ],
        "pcb_port_not_connected_error_id": "pcb_port_not_connected_error_trace_source_trace_2",
        "type": "pcb_port_not_connected_error",
      },
    ]
  `)
  expect(errors.length).toBe(1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
