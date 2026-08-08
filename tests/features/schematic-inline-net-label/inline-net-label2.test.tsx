import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inline net label on a vertical trace reads bottom-to-top", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20} schMaxTraceDistance={6}>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0603"
        schX={0}
        schY={0}
        schRotation={90}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0603"
        schX={0}
        schY={-5}
        schRotation={90}
      />

      <trace schDisplayLabel="SPI_SCK" from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const inlineLabels = circuit.db.schematic_text
    .list()
    .filter((text) => text.text === "SPI_SCK")

  expect(inlineLabels).toHaveLength(1)
  const inlineLabel = inlineLabels[0]!

  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "SPI_SCK"),
  ).toHaveLength(0)

  // A quarter turn counter-clockwise, so the name reads bottom-to-top, and it
  // sits to the left of the wire (which is "above" it once rotated).
  expect(inlineLabel.rotation).toBe(-90)
  const traceEdges = circuit.db.schematic_trace.list()[0]!.edges
  const longestVerticalEdge = traceEdges
    .filter((edge) => Math.abs(edge.from.x - edge.to.x) < 1e-6)
    .sort(
      (a, b) => Math.abs(b.from.y - b.to.y) - Math.abs(a.from.y - a.to.y),
    )[0]!
  expect(inlineLabel.position.x).toBeLessThan(longestVerticalEdge.from.x)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
