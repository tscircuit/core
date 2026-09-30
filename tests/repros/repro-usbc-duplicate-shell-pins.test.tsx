import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbCircuitJson from "tests/fixtures/assets/usb-c-C2765186-duplicate-shell-pins.circuit.json"

test("repro: USB-C duplicate shell pins lose all four PCB port associations", async () => {
  const { circuit } = getTestFixture()
  // C2765186 fetched through @tscircuit/eval's parts engine on 2026-09-30.
  const partCircuitJson = usbCircuitJson.map((element) =>
    any_circuit_element.parse(element),
  )

  circuit.add(
    <board
      width="26mm"
      height="18mm"
      routingDisabled
      partsEngine={{
        findPart: async () => ({ jlcpcb: ["C2765186"] }),
        fetchPartCircuitJson: async () => partCircuitJson,
      }}
    >
      <connector
        name="J1"
        standard="usb_c"
        supplierPartNumbers={{ jlcpcb: ["C2765186"] }}
        connections={{ SHELL1: "net.GND", SHELL2: "net.GND" }}
      />
      <net name="GND" isGroundNet />
      <pcbnotetext
        pcbY={6}
        text="C2765186: duplicated shell pins"
        fontSize={0.7}
      />
      <pcbnotetext
        pcbY={-6}
        text="4 shell slots, 0 PCB port associations"
        fontSize={0.6}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // These assertions capture the defect, not the desired connected-shell behavior.
  const ambiguities = circuit.db.source_ambiguous_port_reference.list()
  expect(ambiguities).toHaveLength(2)
  const ground = circuit.db.source_net.getWhere({ name: "GND" })!
  const groundTraces = circuit.db.source_trace
    .list()
    .filter((trace) =>
      trace.connected_source_net_ids.includes(ground.source_net_id),
    )
  expect(ambiguities.map((error) => error.source_port_id).sort()).toEqual(
    groundTraces.flatMap((trace) => trace.connected_source_port_ids).sort(),
  )
  const shellHoles = circuit.db.pcb_plated_hole.list()
  expect(shellHoles).toHaveLength(4)
  expect(shellHoles.filter((hole) => hole.pcb_port_id)).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
