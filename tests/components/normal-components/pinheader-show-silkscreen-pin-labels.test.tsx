import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pinheader showSilkscreenPinLabels prop behavior - all scenarios", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="28mm" height="20mm">
      {/* Auto-generated footprint with showSilkscreenPinLabels=true (shows pin labels) */}
      <pinheader
        name="P1_auto_showSilkscreenPinLabels_true"
        pinCount={4}
        showSilkscreenPinLabels={true}
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
        pcbX={-8}
        pcbY={-5}
      />

      {/* Auto-generated footprint with showSilkscreenPinLabels=false (hides pin labels) */}
      <pinheader
        name="P2_auto_showSilkscreenPinLabels_false"
        pinCount={4}
        showSilkscreenPinLabels={false}
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
        pcbX={8}
        pcbY={-5}
      />

      {/* Auto-generated footprint with default behavior (hides pin labels) */}
      <pinheader
        name="P3_auto_showSilkscreenPinLabels_default"
        pinCount={4}
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
        pcbX={-8}
        pcbY={5}
      />

      {/* Explicit footprint always shows pin labels (ignores prop) */}
      <pinheader
        name="P4_explicit_showSilkscreenPinLabels_false"
        pinCount={4}
        showSilkscreenPinLabels={false}
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
        footprint="pinrow4"
        pcbX={8}
        pcbY={5}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
