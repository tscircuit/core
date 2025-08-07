import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pinheader with auto-generated footprint showSilkscreenPinLabels=true should display pin labels", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="P1"
        pinCount={4}
        showSilkscreenPinLabels={true}
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-auto-footprint-true")
})

test("pinheader with auto-generated footprint showSilkscreenPinLabels=false should hide pin labels", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="P2"
        pinCount={4}
        showSilkscreenPinLabels={false}
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-auto-footprint-false")
})

test("pinheader with auto-generated footprint default behavior should hide pin labels", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="P3"
        pinCount={4}
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-auto-footprint-default",
  )
})

test("pinheader with explicit footprint should always show pin labels regardless of prop", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="P4"
        pinCount={4}
        showSilkscreenPinLabels={false}
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
        footprint="pinrow4"
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-explicit-footprint-always-shows",
  )
})
