import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import WifiSounder from "./assets/wifi-sounder"

test("Wi-Fi sounder schematic with manual placements inside a sheet", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(<WifiSounder />)
  await circuit.renderUntilSettled()

  // One anchor per section catches a whole-section shift as well as repacking.
  const center = (name: string) => {
    const source = circuit.db.source_component.getWhere({ name })!
    return circuit.db.schematic_component.getWhere({
      source_component_id: source.source_component_id,
    })!.center
  }
  expect(center("J1")).toEqual({ x: -8, y: 4 })
  expect(center("U2")).toEqual({ x: 5.5, y: 4.7 })
  expect(center("U1")).toEqual({ x: -4.6, y: -4 })
  expect(center("U3")).toEqual({ x: 5.3, y: -4.3 })

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
