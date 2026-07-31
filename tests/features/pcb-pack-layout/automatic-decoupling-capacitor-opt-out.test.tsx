import { expect, test } from "bun:test"
import { getDecouplingCapacitorRelationships } from "lib/utils/decoupling-capacitors/get-decoupling-capacitor-relationships"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("does not classify a capacitor when its VBAT pin opts out", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          1: "VBAT",
          4: "GND",
        }}
        pinAttributes={{
          VBAT: {
            requiresPower: true,
            shouldHaveDecouplingCapacitor: false,
          },
        }}
      />

      <capacitor name="C1" capacitance="100uF" footprint="1210" />

      <trace from=".U1 > .VBAT" to=".C1 > .1" />
      <trace from=".C1 > .2" to="net.GND" />
      <trace from=".U1 > .GND" to="net.GND" />

      <pcbnotetext
        pcbX={0}
        pcbY={-8}
        text="C1: VBAT hold-up capacitor opts out of decoupling"
        fontSize={0.8}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(getDecouplingCapacitorRelationships(circuit.db)).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
