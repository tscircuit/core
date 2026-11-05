import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ESP32_S3_WROOM_1_N16 } from "./esp32-s3-wroom-1-n16-import"

test("full MCU portMap selects the primary and exposes distinct split ports", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={30} height={36} routingDisabled>
      <ESP32_S3_WROOM_1_N16 name="U1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const chip: any = circuit.selectOne(".U1")
  expect(chip.portMap.pin1._parsedProps.pinNumber).toBe(1)
  expect(chip.portMap.pin40._parsedProps.pinNumber).toBe(40)
  expect(chip.portMap.pin41._parsedProps.pinNumber).toBe(41)
  expect(chip.portMap.pin41._isPrimaryPort).toBe(true)
  expect(chip.portMap.pin41).toBe(chip.portMap.GND3)
  const splitIds = [
    chip.portMap.pin41.source_port_id,
    ...Array.from(
      { length: 8 },
      (_, i) => chip.portMap[`pin41_internal_${i + 1}`].source_port_id,
    ),
  ]
  expect(new Set(splitIds).size).toBe(9)
  expect(
    new Set(
      circuit.db.source_component_internal_connection.list()[0].source_port_ids,
    ),
  ).toEqual(new Set(splitIds))
})
