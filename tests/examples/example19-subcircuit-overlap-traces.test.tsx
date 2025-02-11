import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { su } from "@tscircuit/soup-util"
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server"

test.skip("If the subcircuit is routing disabled, it should not have traces from the autorouter but it does have", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" autorouter="auto-cloud">
      <group subcircuit routingDisabled>
        <resistor footprint="0402" resistance={1000} name="R1" pcbX={-2} />
        <resistor footprint="0402" resistance={1000} name="R2" pcbX={2} />
        <trace from=".R1 .1" to=".R2 .1" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcb_traces = su(circuit.getCircuitJson()).pcb_trace.list()
  expect(pcb_traces).toMatchInlineSnapshot(`
    [
      {
        "pcb_trace_id": "pcb_trace_Net-(R1_source_component_0-Pad1)",
        "route": [
          {
            "layer": "top",
            "route_type": "wire",
            "width": 0.16,
            "x": 1.5,
            "y": 0,
          },
          {
            "layer": "top",
            "route_type": "wire",
            "width": 0.16,
            "x": 0.9483,
            "y": 0,
          },
        ],
        "source_trace_id": "source_trace_0",
        "trace_length": 0.5517,
        "type": "pcb_trace",
      },
      {
        "pcb_trace_id": "pcb_trace_Net-(R1_source_component_0-Pad1)",
        "route": [
          {
            "layer": "top",
            "route_type": "wire",
            "width": 0.16,
            "x": 0.9483,
            "y": 0,
          },
          {
            "layer": "top",
            "route_type": "wire",
            "width": 0.16,
            "x": 0.3966,
            "y": -0.5517,
          },
          {
            "layer": "top",
            "route_type": "wire",
            "width": 0.16,
            "x": -1.9483,
            "y": -0.5517,
          },
          {
            "layer": "top",
            "route_type": "wire",
            "width": 0.16,
            "x": -2.5,
            "y": 0,
          },
        ],
        "source_trace_id": "source_trace_0",
        "trace_length": 3.9053,
        "type": "pcb_trace",
      },
    ]
  `)
})

test("Autorouter should inherit if the parent subcircuit has async autorouter enabled", async () => {
  const { circuit } = getTestFixture()
  const { autoroutingServerUrl } = getTestAutoroutingServer()

  const cloudAutorouterConfig = {
    serverUrl: autoroutingServerUrl,
    serverMode: "solve-endpoint",
    inputFormat: "simplified",
  } as const

  circuit.add(
    <board width="10mm" height="10mm" autorouter={cloudAutorouterConfig}>
      <group subcircuit>
        <resistor footprint="0402" resistance={1000} name="R1" pcbX={-2} />
        <resistor footprint="0402" resistance={1000} name="R2" pcbX={2} />
        <trace from=".R1 .1" to=".R2 .1" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcb_traces = su(circuit.getCircuitJson()).pcb_trace.list()
  expect(pcb_traces).toMatchInlineSnapshot(`
    [
      {
        "pcb_trace_id": "pcb_trace_0",
        "route": [
          {
            "layer": "top",
            "route_type": "wire",
            "width": 0.1,
            "x": -2.5,
            "y": 0,
          },
          {
            "layer": "top",
            "route_type": "wire",
            "width": 0.1,
            "x": -2,
            "y": 0,
          },
          {
            "layer": "top",
            "route_type": "wire",
            "width": 0.1,
            "x": -2,
            "y": 1.3,
          },
          {
            "layer": "top",
            "route_type": "wire",
            "width": 0.1,
            "x": 1.5,
            "y": 1.3,
          },
          {
            "layer": "top",
            "route_type": "wire",
            "width": 0.1,
            "x": 1.5,
            "y": 0,
          },
        ],
        "type": "pcb_trace",
      },
    ]
  `)
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
