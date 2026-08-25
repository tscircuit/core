import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("components with the same schY render with a connection offset", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" footprint="0402" resistance="1k" schX={-2} schY={0} />
      <mosfet
        name="Q1"
        channelType="n"
        mosfetMode="depletion"
        footprint="sot23"
        schX={0}
        schY={0}
      />
      <trace from=".R1 .pin2" to=".Q1 .pin3" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
