import { expect, test } from "bun:test"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { systemblock } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("React fragment passed to circuit.add preserves all top-level system block pages", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <>
      <systemblock.page name="Data and control">
        <systemblock.component name="adc" displayName="ADS1115" />
        <systemblock.component name="mcu" displayName="Pico" />
        <systemblock.connection from="adc" to="mcu" label="I2C" />
      </systemblock.page>
      <systemblock.page name="Power paths">
        <systemblock.component name="usb" displayName="USB-C" />
        <systemblock.component name="reg" displayName="AP2112" />
        <systemblock.connection from="usb" to="reg" label="5V" />
      </systemblock.page>
    </>,
  )
  await circuit.renderUntilSettled()

  const pages = circuit.db.system_block_page.list()
  expect(pages.map((page) => page.name)).toEqual([
    "Data and control",
    "Power paths",
  ])

  const powerPage = pages.find((page) => page.name === "Power paths")!
  await expect(
    convertCircuitJsonToSystemSvg(circuit.getCircuitJson(), {
      systemBlockPageId: powerPage.system_block_page_id,
      width: 650,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
