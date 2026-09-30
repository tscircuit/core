import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbCircuitJson from "tests/fixtures/assets/usb-c-C2765186-duplicate-shell-pins.circuit.json"

// Enable this diagnostic test on the unfixed branch to regenerate the failure snapshots.
// It stays skipped so the stacked fix can share the same repro files.
test.skip("repro: grounded USB-C shell has no routed PCB connection", async () => {
  const { circuit } = getTestFixture()
  const partCircuitJson = usbCircuitJson.map((element) =>
    any_circuit_element.parse(element),
  )
  circuit.add(
    <board
      width="30mm"
      height="18mm"
      autorouter="auto-local"
      partsEngine={{
        findPart: async () => ({ jlcpcb: ["C2765186"] }),
        fetchPartCircuitJson: async () => partCircuitJson,
      }}
    >
      <connector
        name="J1"
        standard="usb_c"
        pcbX={-5}
        schX={0}
        schY={1}
        supplierPartNumbers={{ jlcpcb: ["C2765186"] }}
        connections={{ SHELL1: "net.GND", SHELL2: "net.GND" }}
      />
      <pinheader
        name="J2"
        pinCount={1}
        pcbX={10}
        pcbY={0}
        schX={3}
        schY={-1}
        connections={{ pin1: "net.GND" }}
      />
      <net name="GND" isGroundNet />
      <pcbnotetext pcbX={-5} pcbY={6} text="USB metal shell" fontSize={0.65} />
      <pcbnotetext pcbX={10} pcbY={4} text="GND" fontSize={0.65} />
      <pcbnotetext
        pcbY={-7}
        text="Shell tabs must connect to GND"
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const ambiguities = circuit.db.source_ambiguous_port_reference.list()
  expect(ambiguities).toHaveLength(2)
  const ground = circuit.db.source_net.getWhere({ name: "GND" })!
  const groundTraces = circuit.db.source_trace
    .list()
    .filter((trace) =>
      trace.connected_source_net_ids.includes(ground.source_net_id),
    )
  expect(groundTraces).toHaveLength(3)
  const usbSource = circuit.db.source_component.getWhere({ name: "J1" })!
  const usbPcb = circuit.db.pcb_component.getWhere({
    source_component_id: usbSource.source_component_id,
  })!
  const shellHoles = circuit.db.pcb_plated_hole.list({
    pcb_component_id: usbPcb.pcb_component_id,
  })
  expect(shellHoles).toHaveLength(4)
  expect(shellHoles.filter((hole) => hole.pcb_port_id)).toHaveLength(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30000)
