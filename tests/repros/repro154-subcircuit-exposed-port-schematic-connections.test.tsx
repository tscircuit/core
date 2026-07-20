import type { SubcircuitProps } from "@tscircuit/props"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Power = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <port name="STATUS" direction="right" connectsTo={["U1.STATUS"]} />
    <port name="VOUT_3V3" direction="right" connectsTo={["U1.VOUT_3V3"]} />
    <port name="SEC_GND" direction="right" connectsTo={["U1.SEC_GND"]} />
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{
        pin1: "STATUS",
        pin2: "VOUT_3V3",
        pin3: "SEC_GND",
      }}
    />
  </subcircuit>
)

const Load = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <port name="ENABLE" direction="left" connectsTo={["U1.ENABLE"]} />
    <port name="GND" direction="left" connectsTo={["U1.GND"]} />
    <port name="3V3" direction="left" connectsTo={["U1.3V3"]} />
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{ pin1: "ENABLE", pin2: "GND", pin3: "3V3" }}
    />
  </subcircuit>
)

test("boxed subcircuits leak generated net names and omit the ground link", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <Power name="power" showAsSchematicBox schX={-4} />
      <Load name="load" showAsSchematicBox schX={4} />

      <trace path={[".power > .VOUT_3V3", ".load > .3V3"]} />
      <trace path={[".power > .SEC_GND", ".load > .GND"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
