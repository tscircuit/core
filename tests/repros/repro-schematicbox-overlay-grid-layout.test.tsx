import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: "A",
  pin2: "B",
  pin3: "C",
  pin4: "D",
  pin5: "E",
  pin6: "F",
  pin7: "G",
  pin8: "H",
}

export default function OverlayGridLayout() {
  return (
    <board>
      <group schGrid gridCols={2} gridGap={4}>
        <chip name="U1" pinLabels={pinLabels} />
        <chip name="U2" pinLabels={pinLabels} />
      </group>
      <schematicbox
        overlay={[
          ".U2 > .pin1",
          ".U2 > .pin2",
          ".U2 > .pin3",
          ".U2 > .pin4",
          ".U2 > .pin5",
          ".U2 > .pin6",
          ".U2 > .pin7",
          ".U2 > .pin8",
        ]}
        padding={0.4}
        title="U2 pins"
      />
    </board>
  )
}

test("repro: schematicbox overlay stays behind after grid layout", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(<OverlayGridLayout />)
  await circuit.renderUntilSettled()

  // Expected: the box surrounds U2's final pin positions with 0.4 padding.
  // Capture current behavior: the box and title remain between U1 and U2.
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
  })
})
