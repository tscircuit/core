import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a pinheader with schWidth below label width (4 pins, rotated)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="P2"
        pinCount={4}
        footprint="pinrow4"
        schRotation={90}
        facingDirection="left"
        schWidth={0.5} // Intentionally less than label width
        showSilkscreenPinLabels={true}
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
