import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing("status LED subcircuit bounds include pcbPadding", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="18mm" height="14mm" routingDisabled schematicDisabled>
      <pcbnotetext text="Status LED subcircuit" pcbY={6.1} fontSize={0.6} />
      <pcbnotetext text="pcbPadding=2mm" pcbY={5.3} fontSize={0.6} />
      <subcircuit name="StatusLed" pcbPadding="2mm">
        <resistor
          name="R1"
          resistance="330"
          footprint="0603"
          pcbX={-1.5}
          connections={{ pin1: "net.V3V3", pin2: ".D1 > .anode" }}
        />
        <led
          name="D1"
          color="green"
          footprint="0603"
          pcbX={1.5}
          connections={{ cathode: "net.GND" }}
        />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbGroups: true,
  })

  // R1 and D1 pads span 5.45 x 0.95 mm; pcbPadding adds 2 mm on every side.
  const statusLedPcbGroup = circuit.db.pcb_group.getWhere({
    name: "StatusLed",
  })!
  expect(statusLedPcbGroup.width).toBeCloseTo(5.45 + 2 + 2)
  expect(statusLedPcbGroup.height).toBeCloseTo(0.95 + 2 + 2)
})
