import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicRect with traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbX={0} pcbY={0} width={100} height={100}>
      <chip
        name="U1"
        footprint="dip8"
        pcbX={10}
        pcbY={10}
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
        name="U2"
        footprint="dip8"
        pcbX={30}
        pcbY={10}
        symbol={
          <symbol>
            <schematicrect
              schX={5}
              schY={0}
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
