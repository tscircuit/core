import { expect, test } from "bun:test"
import { systemblock } from "lib"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pages have independent name scopes and support disconnected and empty groups", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <systemblock.page name="overview">
      <systemblock.component name="controller" displayName="Main controller" />
      <systemblock.component
        name="external"
        displayName="External device"
        description="No declared interface yet"
      />
      <systemblock.group name="reserved" displayName="Future expansion" />
    </systemblock.page>,
  )
  circuit.add(
    <systemblock.page name="detail" direction="down">
      <systemblock.component
        name="controller"
        displayName="Controller internals"
        description="Environmental monitoring and wireless communication scheduling, including IdentifierWithoutAnyWordBreaks1234567890"
      />
      <systemblock.component
        name="external"
        displayName="Voltage < 5 V & current > 0"
      />
      <systemblock.connection
        from="controller"
        to="external"
        label="Control & status"
        direction="both"
      />
    </systemblock.page>,
  )
  circuit.add(<systemblock.page name="empty" />)
  circuit.render()
  const before = structuredClone(circuit.getCircuitJson())
  circuit.render()
  expect(circuit.getCircuitJson()).toEqual(before)
  for (const page of circuit.db.system_block_page.list()) {
    expect(page.width).toBeGreaterThan(0)
    expect(page.height).toBeGreaterThan(0)
    await expect(
      convertCircuitJsonToSystemSvg(before, {
        systemBlockPageId: page.system_block_page_id,
        width: 650,
      }),
    ).toMatchSvgSnapshot(import.meta.path, `system-blocks-page-${page.name}`)
  }
})
