import { expect, test } from "bun:test"
import { expectKeystone3002Routing } from "tests/fixtures/expect-keystone-3002-routing"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  Keystone3002Board,
  getKeystone3002Footprint,
  keystone3002FootprintName,
} from "tests/fixtures/keystone-3002-board"

test("the reported kicad library reference routes the complete Keystone 3002 board", async () => {
  const footprintCircuitJson = getKeystone3002Footprint()
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async (footprintName) => {
          expect(footprintName).toBe(keystone3002FootprintName)
          return { footprintCircuitJson }
        },
      },
    },
  })
  circuit.add(<Keystone3002Board />)
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expectKeystone3002Routing(circuit)
})
