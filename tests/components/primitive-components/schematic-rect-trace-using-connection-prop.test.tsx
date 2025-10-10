import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

test("SchematicRect with traces using connections prop", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        schX={0}
        schY={0}
        name="U1"
        symbol={
          <symbol>
            <schematicrect
              schX={0}
              schY={0}
              width={2}
              height={2}
              isFilled={false}
            />
            <port name="pin1" direction="right" schX={1} schY={0} />
          </symbol>
        }
      />
      <chip
        schX={4}
        schY={0}
        name="U2"
        symbol={
          <symbol>
            <schematicrect
              schX={0}
              schY={0}
              width={2}
              height={2}
              isFilled={false}
            />
            <port name="pin1" direction="left" schX={4} schY={0} />
          </symbol>
        }
        connections={{
          pin1: sel.U1.pin1,
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematic_trace = circuit
    .getCircuitJson()
    .filter((c) => c.type === "schematic_trace")
  expect(schematic_trace.length).toBe(1)
  const schematic_ports = circuit
    .getCircuitJson()
    .filter((c) => c.type === "schematic_port")
  expect(schematic_ports.length).toBe(2)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
