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
})
