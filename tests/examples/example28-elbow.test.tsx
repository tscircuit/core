import { sel } from "lib/sel"
import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Test for schematic with sel-based netlabel and connections

test("example28 fix elbow", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <group>
        <solderjumper
          name="JP1"
          footprint="solderjumper2_bridged12"
          pinCount={3}
          schRotation={"180deg"}
          bridged
          connections={{
            pin2: "net.V3_3",
          }}
        />

        <resistor
          resistance="2.2k"
          footprint="0402"
          name="R2"
          schX={1}
          schY={-1}
          schRotation={"-90deg"}
          connections={{
            pin1: "JP1.pin1",
            pin2: "net.SDA",
          }}
        />

        <resistor
          resistance="2.2k"
          footprint="0402"
          name="R1"
          schX={-1}
          schY={-1}
          schRotation={"-90deg"}
          connections={{
            pin1: "JP1.pin3",
            pin2: "net.SCL",
          }}
        />
      </group>
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
