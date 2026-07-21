import type { SubcircuitProps } from "@tscircuit/props"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Source = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <port name="UNUSED" direction="right" connectsTo={["U1.UNUSED"]} />
    <port name="VCC" direction="right" connectsTo={["U1.VCC"]} />
    <port name="GND" direction="right" connectsTo={["U1.GND"]} />
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{ pin1: "UNUSED", pin2: "VCC", pin3: "GND" }}
    />
  </subcircuit>
)

const Sink = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <port name="UNUSED" direction="left" connectsTo={["U1.UNUSED"]} />
    <port name="GND" direction="left" connectsTo={["U1.GND"]} />
    <port name="VCC" direction="left" connectsTo={["U1.VCC"]} />
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{ pin1: "UNUSED", pin2: "GND", pin3: "VCC" }}
    />
  </subcircuit>
)

test("boxed subcircuit port label expectations are visually explicit", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematictext
        text="UNUSED (source pin 1, sink pin 1): NO LABELS"
        schX={0}
        schY={1.4}
        fontSize={0.28}
        anchor="center"
      />
      <schematictext
        text="VCC (source pin 2 -> sink pin 3): GREEN WIRE"
        schX={0}
        schY={0.9}
        fontSize={0.28}
        anchor="center"
        color="green"
      />
      <schematictext
        text={
          'GND (source pin 3 -> sink pin 2): SAME "source_GND/sink_GND" LABEL'
        }
        schX={0}
        schY={-1}
        fontSize={0.28}
        anchor="center"
        color="blue"
      />

      <Source name="source" showAsSchematicBox schX={-6} />
      <Sink name="sink" showAsSchematicBox schX={6} />

      <trace path={[".source > .VCC", ".sink > .VCC"]} />
      <trace path={[".source > .GND", ".sink > .GND"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
