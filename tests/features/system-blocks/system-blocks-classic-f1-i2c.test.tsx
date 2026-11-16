import { beforeAll, expect, test } from "bun:test"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { systemblock } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()

beforeAll(async () => {
  circuit.add(
    <systemblock.page name="classic-f1-i2c" displayName="Classic F1 I²C">
      <systemblock.component
        name="controller"
        displayName="RP2040"
        description="Decodes rotation and counts turns"
      />
      <systemblock.component
        name="storage"
        displayName="FRAM"
        description="32 KB retains the turn count"
      />
      <systemblock.connection
        from="controller"
        to="storage"
        label="I²C"
        direction="both"
      />
    </systemblock.page>,
  )
  circuit.render()
  await expect(
    convertCircuitJsonToSystemSvg(circuit.getCircuitJson(), { width: 640 }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})

test.failing(
  "places the Classic F1 I²C label entirely below the horizontal wire",
  () => {
    const [i2c] = circuit.db.system_block_connection.list()
    const [start] = i2c.route
    // Diagram Y increases upward. The text and its halo extend 2 mm above the label center.
    expect(i2c.label_anchor_center!.y + 2).toBeLessThan(start.y)
  },
)
