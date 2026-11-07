import { expect, test } from "bun:test"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { assertSystemWireSeparation } from "./assert-system-wire-separation"
import { assertSystemGeometry } from "./assert-system-geometry"
import { SystemOverview } from "./fixtures/rvboy-system-overview"

test("RVBoy power: dense interfaces retain obstacle-free routes and readable labels", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.schematicDisabled = true
  circuit.add(
    <board>
      <SystemOverview />
    </board>,
  )
  circuit.render()
  const json = circuit.getCircuitJson()
  assertSystemGeometry(json)
  const page = circuit.db.system_block_page
    .list()
    .find((p) => p.name === "power")!
  const connections = circuit.db.system_block_connection
    .list()
    .filter((c) => c.system_block_page_id === page.system_block_page_id)
  expect(connections).toHaveLength(13)
  assertSystemWireSeparation(connections)
  await expect(
    convertCircuitJsonToSystemSvg(json, {
      systemBlockPageId: page.system_block_page_id,
      width: 1400,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
