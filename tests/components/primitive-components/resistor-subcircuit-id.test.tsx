import { expect, test } from "bun:test"
import { su } from "@tscircuit/circuit-json-util"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistor should have subcircuit_id on it's elements", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group subcircuit name="G1">
      <resistor
        name="R1"
        resistance={100}
        footprint={"0402"}
        pcbX={1}
        pcbY={1}
      />
    </group>,
  )

  circuit.render()

  const pcbSmtpads = circuit.db.pcb_smtpad.list()
  expect(pcbSmtpads).toHaveLength(2)

  // Check that both pads have the correct subcircuit_id
  for (const pad of pcbSmtpads) {
    expect(pad.subcircuit_id).toBe("subcircuit_source_group_0")
  }
})
