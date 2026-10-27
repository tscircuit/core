import { expect, test } from "bun:test"
import { Capacitor } from "lib/components/normal-components/Capacitor"
import { Diode } from "lib/components/normal-components/Diode"
import { Led } from "lib/components/normal-components/Led"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit polarity conflicts are rejected and matching options preserve user input", async () => {
  const pinLabels = { pin1: ["cathode", "neg"], pin2: ["anode", "pos"] }
  expect(
    () =>
      new Diode({
        name: "D_CONFLICT",
        footprint: "sod123_anodepin1",
        pinLabels,
      }),
  ).toThrow("pinLabels conflict")
  expect(
    () =>
      new Led({
        name: "LED_CONFLICT",
        footprint: "led0805_cathodepin2",
        pinLabels,
      }),
  ).toThrow("pinLabels conflict")
  expect(
    () =>
      new Capacitor({
        name: "C_CONFLICT",
        capacitance: "10uF",
        polarized: true,
        footprint: "cap0805_nonpolarized",
      }),
  ).toThrow("explicitly disables polarity")
  const { circuit } = getTestFixture()
  const props = {
    name: "D_MATCH",
    footprint: "sod123_anodepin2_cathodepin1",
    pinLabels,
  }
  circuit.add(
    <board width={12} height={8} routingDisabled>
      <diode {...props} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const diode = circuit.selectOne(".D_MATCH") as Diode
  expect(diode.props.footprint).toBe(props.footprint)
  expect(diode._parsedProps.footprint).toBe(props.footprint)
  expect(diode._parsedProps.pinLabels).toEqual(pinLabels)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
