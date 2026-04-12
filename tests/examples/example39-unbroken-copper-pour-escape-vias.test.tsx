import { expect, test } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unbroken inner-layer copper pours participate in autorouting", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" layers={4}>
      <copperpour layer="inner1" connectsTo="net.GND" unbroken />
      <copperpour layer="inner2" connectsTo="net.VCC" unbroken />
      <chip
        footprint="soic10"
        name="U1"
        connections={{
          pin2: "net.GND",
          pin3: "net.VCC",
          pin4: "net.GND",
        }}
      />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        connections={{ pin1: "U1.pin1", pin2: "net.GND" }}
      />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C2"
        pcbRotation="90deg"
        connections={{ pin1: "U1.pin6", pin2: "net.GND" }}
      />
      <chip
        footprint="soic6"
        name="U2"
        connections={{
          pin1: "U1.pin8",
          pin2: "U1.pin7",
          pin3: "U1.pin3",
          pin4: "net.GND",
          pin5: "U1.pin10",
          pin6: "U1.pin9",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const copperPourLayers = new Set(
    circuit.db.pcb_copper_pour.list().map((pour) => pour.layer),
  )

  expect(copperPourLayers.has("inner1")).toBe(true)
  expect(copperPourLayers.has("inner2")).toBe(true)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
