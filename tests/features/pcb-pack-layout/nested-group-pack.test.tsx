import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested group pack with various resistors and capacitors", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pack routingDisabled>
      <group pack>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0805"
          connections={{ pin1: "net.VCC" }}
        />
        <resistor
          name="R2"
          resistance="2.2k"
          footprint="0603"
          connections={{ pin1: "net.VCC" }}
        />
        <resistor
          name="R3"
          resistance="3.3k"
          footprint="0805"
          connections={{ pin1: "net.VCC" }}
        />
      </group>

      <group pack>
        <resistor
          name="R4"
          resistance="4.4k"
          footprint="0805"
          connections={{ pin1: "net.VCC" }}
        />
        <resistor
          name="R5"
          resistance="5.5k"
          footprint="0603"
          connections={{ pin1: "net.VCC" }}
        />
        <resistor
          name="R6"
          resistance="6.6k"
          footprint="0805"
          connections={{ pin1: "net.VCC" }}
        />
      </group>
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
