import { expect, test } from "bun:test"
import { expectKeystone3002Routing } from "tests/fixtures/expect-keystone-3002-routing"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  Keystone3002Board,
  getKeystone3002Footprint,
} from "tests/fixtures/keystone-3002-board"

test.failing(
  "a local KiCad Keystone 3002 footprint routes both positive contacts and the negative terminal",
  async () => {
    const footprintCircuitJson = getKeystone3002Footprint()
    const { circuit } = getTestFixture({
      platform: {
        resolveProjectStaticFileImportUrl: async () =>
          "https://example.com/BatteryHolder_Keystone_3002_1x2032.kicad_mod",
        footprintFileParserMap: {
          kicad_mod: {
            loadFromUrl: async () => {
              return { footprintCircuitJson }
            },
          },
        },
      },
    })
    circuit.add(
      <Keystone3002Board footprint="./BatteryHolder_Keystone_3002_1x2032.kicad_mod" />,
    )
    await circuit.renderUntilSettled()

    // Save the actual board before checking the missing copper connections.
    // The fix updates these snapshots to show the completed routing.
    await expect(circuit).toMatchPcbSnapshot(import.meta.path)
    await expect(circuit).toMatch3dSnapshot(import.meta.path, {
      camPos: [32, 52, -42],
      poppygl: { backgroundColor: [245, 247, 250], grid: false },
    })

    expectKeystone3002Routing(circuit)
  },
  30_000,
)
