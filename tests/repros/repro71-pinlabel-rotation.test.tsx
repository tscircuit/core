import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("pinrow labels should be readable at various component rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm">
      {/* Test pinrow at 0 degrees */}
      <jumper
        name="JP1"
        footprint="pinrow4"
        pcbX={-5}
        pcbY={5}
        pcbRotation={0}
        pinLabels={{ pin1: "GND", pin2: "VDD", pin3: "SDA", pin4: "SCL" }}
      />

      {/* Test pinrow at 45 degrees */}
      <jumper
        name="JP2"
        footprint="pinrow4"
        pcbX={5}
        pcbY={5}
        pcbRotation={45}
        pinLabels={{ pin1: "GND", pin2: "VDD", pin3: "SDA", pin4: "SCL" }}
      />

      {/* Test pinrow at 90 degrees */}
      <jumper
        name="JP3"
        footprint="pinrow4"
        pcbX={-5}
        pcbY={-5}
        pcbRotation={90}
        pinLabels={{ pin1: "GND", pin2: "VDD", pin3: "SDA", pin4: "SCL" }}
      />

      {/* Test pinrow at 135 degrees */}
      <jumper
        name="JP4"
        footprint="pinrow4"
        pcbX={5}
        pcbY={-5}
        pcbRotation={135}
        pinLabels={{ pin1: "GND", pin2: "VDD", pin3: "SDA", pin4: "SCL" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
