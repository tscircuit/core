import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fallback net labels prefer the lower pin on the largest connected chip", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="12mm" routingDisabled>
      <chip
        name="U1"
        schX={-4}
        pinLabels={{
          pin1: ["X1"],
          pin2: ["X2"],
          pin3: ["NC3"],
          pin4: ["NC4"],
        }}
      />
      <chip
        name="U2"
        schY={-3}
        pinLabels={{
          pin1: ["Y1"],
          pin2: ["Y2"],
          pin3: ["Y3"],
        }}
      />
      <resistor name="R1" resistance="1k" schX={4} />
      <trace path={[".U1 > .X2", ".R1 > .pin1"]} />
      <trace path={[".U1 > .X1", ".R1 > .pin1"]} />
      <trace path={[".U2 > .Y1", ".R1 > .pin1"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const fallbackLabels = circuit.db.schematic_net_label
    .list()
    .map((label) => label.text)

  expect(fallbackLabels).toContain("U1_X1")
  expect(fallbackLabels).not.toContain("U1_X2")
  expect(fallbackLabels).not.toContain("U2_Y1")
  expect(fallbackLabels).not.toContain("R1_pin1")
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
