import { expect, test } from "bun:test"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { assertSystemGeometry } from "./assert-system-geometry"
import { assertSystemWireSmoothness } from "./assert-system-wire-smoothness"
import { FlipPhoneSystemOverview } from "./fixtures/flip-phone-system-overview"

test("flip phone: labelled links across subsystems stay direct, without hooks or kinks", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.schematicDisabled = true
  circuit.add(
    <board>
      <FlipPhoneSystemOverview />
    </board>,
  )
  circuit.render()
  const json = circuit.getCircuitJson()
  assertSystemGeometry(json)
  // Labels sit on finished wires. A wire bent to reach a label slot, or a port
  // out of line with its neighbor, used to add hooks and 1 mm S-bends here.
  assertSystemWireSmoothness(circuit.db.system_block_connection.list(), {
    minRadius: 1.5,
    maxBends: 5,
  })
  await expect(
    convertCircuitJsonToSystemSvg(json, { width: 1800 }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
