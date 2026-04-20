import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro111: board with copperpour and rect-pad plated holes on GND and VCC", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="22mm">
      <net name="GND" />
      <net name="VCC" />
      <chip
        footprint={"pinrow4"}
        name="H_GND"
        pcbX={0}
        pcbY={5}
        connections={{
          pin1: "net.GND",
          pin2: "net.GND",
          pin3: "net.GND",
          pin4: "net.GND",
        }}
      />
      <chip
        footprint={"pinrow4"}
        name="H_VCC1"
        pcbX={0}
        pcbY={0}
        connections={{
          pin1: "net.VCC",
          pin2: "net.VCC",
          pin3: "net.VCC",
          pin4: "net.VCC",
        }}
      />
      <chip
        footprint={"pinrow4"}
        name="H_VCC2"
        pcbX={0}
        pcbY={-5}
        connections={{
          pin1: "net.VCC",
          pin2: "net.VCC",
          pin3: "net.VCC",
          pin4: "net.VCC",
        }}
      />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
