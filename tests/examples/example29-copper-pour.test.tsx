import { test, expect } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("copper pour with board outline", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="20mm"
      height="20mm"
      outline={[
        { x: -10, y: -10 },
        { x: 10, y: -10 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
        { x: 0, y: 0 },
        { x: -10, y: 0 },
      ]}
    >
      <net name="GND" />
      <net name="VCC" />
      <resistor
        name="R1"
        footprint="0805"
        resistance="10k"
        pcbX={-5}
        pcbY={-2}
        connections={{
          pin1: "net.GND",
          pin2: "net.VCC",
        }}
      />
      <resistor
        name="R2"
        footprint="0805"
        resistance="1k"
        pcbX={5}
        pcbY={-2}
        connections={{
          pin1: "net.VCC",
          pin2: "net.VCC",
        }}
      />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-outline")
})

test("multiple copper pours on different layers", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <net name="GND" />
      <net name="VCC" />
      <resistor
        name="R1"
        footprint="0805"
        resistance="10k"
        pcbX={-5}
        connections={{
          pin2: "net.GND",
        }}
      />
      <resistor
        name="R2"
        footprint="0805"
        resistance="10k"
        pcbX={5}
        layer={"bottom"}
        connections={{
          pin2: "net.VCC",
        }}
      />
      <platedhole shape="circle" holeDiameter={1.2} outerDiameter={2.4} />
      <hole pcbY={-4} diameter={2} />
      <copperpour connectsTo="net.GND" layer="top" />
      <copperpour connectsTo="net.VCC" layer="bottom" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-multiple-layers")
})
