import { expect, test } from "bun:test"
import "tests/fixtures/extend-expect-circuit-snapshot"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "tscircuit"

test("explicit netlabels draw extra schematic traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        pcbX={1.27}
        pcbY={0}
        footprint="cap0402"
        capacitance="0.1uF"
        pcbRotation={-90}
        schX={0}
        schY={3.05}
        schRotation={-90}
      />
      <capacitor
        name="C2"
        connections={{ pin2: sel.C1.pin2 }}
        pcbX={5.08}
        pcbY={1.27}
        pcbRotation={-90}
        footprint="cap0402"
        capacitance="0.1uF"
        schX={-1}
        schY={3.05}
        schRotation={-90}
      />
      <capacitor
        name="C4"
        pcbX={2.54}
        pcbY={0}
        footprint="cap0402"
        capacitance="1uF"
        pcbRotation={-90}
        schX={1.2}
        schY={3.05}
        schRotation={-90}
      />
      <netlabel
        net="VCC"
        anchorSide="bottom"
        connectsTo={[sel.C1.pin1, sel.C2.pin1, sel.C4.pin1]}
        schY={4}
      />
      <netlabel
        net="GND"
        anchorSide="top"
        connectsTo={[sel.C1.pin2, sel.C4.pin2]}
        schY={2.1}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, { grid: false })
})
