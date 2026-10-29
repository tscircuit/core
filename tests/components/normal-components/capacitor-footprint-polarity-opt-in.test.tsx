import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor intent requests Footprinter polarity for implicit and explicit definitions", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={26} height={8} routingDisabled>
      <capacitor
        name="C_PROP"
        capacitance="10uF"
        polarized
        footprint="cap0805"
        pcbX={-8}
      />
      <capacitor
        name="C_SWAP"
        capacitance="10uF"
        polarized
        footprint="cap0805_positivepin2_negativepin1"
        pcbX={0}
      />
      <capacitor
        name="C_EXPLICIT"
        capacitance="10uF"
        polarized
        footprint="cap0805_polarized"
        pcbX={8}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  // Core delegates polarized intent; Footprinter supplies its existing silkscreen plus.
  expect(
    circuit.db.pcb_component
      .list()
      .map(
        ({ pcb_component_id }) =>
          circuit.db.pcb_silkscreen_path.list({ pcb_component_id }).length,
      ),
  ).toEqual([3, 3, 3])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
