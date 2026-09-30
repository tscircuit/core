import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ER_OLED096_1_3W_CONNECTOR_FOOTPRINT,
  ER_OLED096_1_3W_CONTACT_COUNT,
} from "./fixtures/er-oled096-1-3w"

test("screen modelprinter string renders via modelcdn at its connector", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="display-device">
      <board name="B1" width={44} height={36} routingDisabled>
        <connector
          name="J1"
          pcbY={-13}
          pinCount={ER_OLED096_1_3W_CONTACT_COUNT}
          footprint={ER_OLED096_1_3W_CONNECTOR_FOOTPRINT}
        />
      </board>
      <assembly.screen
        name="SCREEN"
        connectsTo=".B1 .J1"
        model="flexscreen_w26.7mm_h19.26mm_sitsflat"
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [65, 55, 85],
    poppygl: { lookAt: [0, 0, 0], backgroundColor: [1, 1, 1], grid: false },
  })
})
