import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("simple route json includes BGA package metadata", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        footprint="bga64_grid8x8_p0.8mm_ball0.47mm_pad0.38mm_tlorigin"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  expect(simpleRouteJson.packages).toHaveLength(1)

  const [pkg] = simpleRouteJson.packages!
  expect(pkg.packageClass).toBe("bga")
  expect(pkg.componentName).toBe("U1")
  expect(pkg.footprint).toBe(
    "bga64_grid8x8_p0.8mm_ball0.47mm_pad0.38mm_tlorigin",
  )

  const pads = circuit.db.pcb_smtpad.list()
  expect(pads.length).toBeGreaterThan(1)
  expect(pkg.padIds).toHaveLength(pads.length)
  expect(simpleRouteJson.obstacles.length).toBeGreaterThan(1)

  for (const padId of pkg.padIds) {
    expect(pads.some((pad) => pad.pcb_smtpad_id === padId)).toBe(true)
    expect(
      simpleRouteJson.obstacles.some((obstacle) =>
        obstacle.connectedTo.includes(padId),
      ),
    ).toBe(true)
  }
})
