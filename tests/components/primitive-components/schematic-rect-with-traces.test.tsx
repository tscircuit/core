import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.skip("SchematicRect with traces", async () => {
  if (process.env.CI) return
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicrect
              center={{ x: 0, y: 0 }}
              width={2}
              height={2}
              isFilled={false}
            />
            <port name="pin1" direction="right" schX={1} schY={0} />
          </symbol>
        }
      />
      <chip
        name="U2"
        symbol={
          <symbol>
            <schematicrect
              center={{ x: 5, y: 0 }}
              width={2}
              height={2}
              isFilled={false}
            />
            <port name="pin1" direction="left" schX={4} schY={0} />
          </symbol>
        }
      />
      <trace from=".U1 > .pin1" to=".U2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematic_trace = circuit
    .getCircuitJson()
    .filter((c) => c.type === "schematic_trace")
  expect(schematic_trace.length).toBe(1)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
