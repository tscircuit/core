import { expect, test } from "bun:test"
import type { SubcircuitProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Power = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <port name="3V3" direction="right" connectsTo={["U1.3V3"]} />
    <port name="GND" direction="right" connectsTo={["U1.GND"]} />
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{ pin1: "3V3", pin2: "GND" }}
    />
  </subcircuit>
)

const Mcu = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <port name="GND" direction="left" connectsTo={["U1.GND"]} />
    <port name="3V3" direction="left" connectsTo={["U1.3V3"]} />
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{ pin1: "GND", pin2: "3V3" }}
    />
  </subcircuit>
)

test("cross-subcircuit anonymous net labels use a readable endpoint name", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematictext
        text="TRACE 1: power.3V3 -> mcu.3V3"
        schX={0}
        schY={1.6}
        fontSize={0.28}
        anchor="center"
        color="green"
      />
      <schematictext
        text="TRACE 2: power.GND -> mcu.GND"
        schX={0}
        schY={1.15}
        fontSize={0.28}
        anchor="center"
        color="blue"
      />
      <schematictext
        text={'EXPECTED: TRACE 2 falls back to "mcu_GND" labels'}
        schX={0}
        schY={-1}
        fontSize={0.3}
        anchor="center"
        color="blue"
      />
      <schematictext
        text={'BOTH GND ports show "mcu_GND"'}
        schX={0}
        schY={-1.45}
        fontSize={0.26}
        anchor="center"
        color="blue"
      />

      <Power name="power" showAsSchematicBox schX={-5} />
      <Mcu name="mcu" showAsSchematicBox schX={5} />

      <trace path={[".power > .3V3", ".mcu > .3V3"]} />
      <trace path={[".power > .GND", ".mcu > .GND"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
