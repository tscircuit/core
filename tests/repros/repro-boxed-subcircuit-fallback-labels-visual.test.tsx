import type { SubcircuitProps } from "@tscircuit/props"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const LeftBox = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <port name="OPEN" direction="right" connectsTo={["U1.OPEN"]} />
    <port name="WIRE" direction="right" connectsTo={["U1.WIRE"]} />
    <port name="LABEL" direction="right" connectsTo={["U1.LABEL"]} />
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{ pin1: "OPEN", pin2: "WIRE", pin3: "LABEL" }}
    />
  </subcircuit>
)

const RightBox = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <port name="OPEN" direction="left" connectsTo={["U1.OPEN"]} />
    <port name="LABEL" direction="left" connectsTo={["U1.LABEL"]} />
    <port name="WIRE" direction="left" connectsTo={["U1.WIRE"]} />
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{ pin1: "OPEN", pin2: "LABEL", pin3: "WIRE" }}
    />
  </subcircuit>
)

test("visual repro for boxed subcircuit fallback labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematictext
        text="OPEN dots are intentional: no generated connectivity labels"
        schX={0}
        schY={1.8}
        fontSize={0.26}
        anchor="center"
      />
      <schematictext
        text="WIRE ports: green trace, no net labels"
        schX={0}
        schY={1.25}
        fontSize={0.26}
        anchor="center"
        color="green"
      />
      <schematictext
        text={'LABEL ports: both must show "left_LABEL/right_LABEL"'}
        schX={0}
        schY={-1.25}
        fontSize={0.26}
        anchor="center"
        color="blue"
      />

      <LeftBox name="left" showAsSchematicBox schX={-6} />
      <RightBox name="right" showAsSchematicBox schX={6} />

      <trace path={[".left > .WIRE", ".right > .WIRE"]} />
      <trace path={[".left > .LABEL", ".right > .LABEL"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
