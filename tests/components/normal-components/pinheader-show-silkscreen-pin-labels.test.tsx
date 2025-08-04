import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pinheader showSilkscreenPinLabels=true should display pin labels on PCB", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="P1"
        pinCount={4}
        showSilkscreenPinLabels={true}
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
        footprint="pinrow4"
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-showlabels-true")
})

test("pinheader showSilkscreenPinLabels=false should hide pin labels on PCB", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="P2"
        pinCount={4}
        showSilkscreenPinLabels={false}
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
        footprint="pinrow4"
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-showlabels-false")
})

test("pinheader default behavior (showSilkscreenPinLabels undefined) should show pin labels", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="P3"
        pinCount={4}
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
        footprint="pinrow4"
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-showlabels-default")
})
