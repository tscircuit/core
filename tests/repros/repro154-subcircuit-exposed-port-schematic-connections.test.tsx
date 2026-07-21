import type { SubcircuitProps } from "@tscircuit/props"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const SourceBox = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <port
      name="UNCONNECTED"
      direction="right"
      connectsTo={["U1.UNCONNECTED"]}
    />
    <port name="ROUTED" direction="right" connectsTo={["U1.ROUTED"]} />
    <port name="FALLBACK" direction="right" connectsTo={["U1.FALLBACK"]} />
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{
        pin1: "UNCONNECTED",
        pin2: "ROUTED",
        pin3: "FALLBACK",
      }}
    />
  </subcircuit>
)

const DestinationBox = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <port name="UNCONNECTED" direction="left" connectsTo={["U1.UNCONNECTED"]} />
    <port name="FALLBACK" direction="left" connectsTo={["U1.FALLBACK"]} />
    <port name="ROUTED" direction="left" connectsTo={["U1.ROUTED"]} />
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{ pin1: "UNCONNECTED", pin2: "FALLBACK", pin3: "ROUTED" }}
    />
  </subcircuit>
)

test("unrouted boxed subcircuit ports get a readable fallback label", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <SourceBox name="source" showAsSchematicBox schX={-4} />
      <DestinationBox name="destination" showAsSchematicBox schX={4} />

      {/* This connection is routed normally. */}
      <trace path={[".source > .ROUTED", ".destination > .ROUTED"]} />
      {/* Both FALLBACK ports should get the same label when this cannot route. */}
      <trace path={[".source > .FALLBACK", ".destination > .FALLBACK"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.schematic_net_label.list().map(({ text }) => text)).toEqual(
    [
      "source_FALLBACK/destination_FALLBACK",
      "source_FALLBACK/destination_FALLBACK",
    ],
  )
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
