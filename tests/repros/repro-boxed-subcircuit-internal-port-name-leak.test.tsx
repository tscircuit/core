import type { SubcircuitProps } from "@tscircuit/props"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Sensor = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <port name="STATUS" direction="right" connectsTo={["U1.STATUS"]} />
    <chip name="U1" footprint="soic8" pinLabels={{ pin1: "STATUS" }} />
  </subcircuit>
)

test("internal subcircuit connection does not become an external label", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematictext
        text="ONLY CONNECTION: sensor.STATUS -> sensor.U1.STATUS (inside sensor)"
        schX={0}
        schY={1.5}
        fontSize={0.26}
        anchor="center"
      />
      <schematictext
        text="NO TRACE LEAVES THE sensor SUBCIRCUIT"
        schX={0}
        schY={1.05}
        fontSize={0.28}
        anchor="center"
      />
      <schematictext
        text="EXPECTED: STATUS remains open and unlabeled"
        schX={0}
        schY={-0.9}
        fontSize={0.3}
        anchor="center"
        color="blue"
      />
      <schematictext
        text="No generated connectivity name is rendered"
        schX={0}
        schY={-1.35}
        fontSize={0.28}
        anchor="center"
        color="blue"
      />

      <Sensor name="sensor" showAsSchematicBox schX={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
