import { expect, test } from "bun:test"
import { systemblock } from "lib"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { assertSystemGeometry } from "./assert-system-geometry"
import { assertSystemWireSmoothness } from "./assert-system-wire-smoothness"

test("rounded fanout and self-loops work in every page direction", async () => {
  for (const direction of ["right", "left", "down", "up"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <systemblock.page name={`rounded-${direction}`} direction={direction}>
        <systemblock.component
          name="control"
          displayName={`Controller (${direction})`}
        />
        <systemblock.component name="sensor" displayName="Sensor" />
        <systemblock.component name="driver" displayName="Driver" />
        <systemblock.connection
          from="control"
          to="sensor"
          label="Readings"
          direction="both"
        />
        <systemblock.connection from="control" to="driver" label="Drive" />
        <systemblock.connection from="control" to="control" label="Watchdog" />
      </systemblock.page>,
    )
    circuit.render()
    const json = circuit.getCircuitJson()
    assertSystemGeometry(json)
    // A wire may be straight; wherever it bends, the bend must be a fillet.
    assertSystemWireSmoothness(circuit.db.system_block_connection.list(), {
      minRadius: 1.5,
      maxBends: 2,
    })
    const loop = circuit.db.system_block_connection
      .list()
      .find(
        (connection) =>
          connection.from_system_block_component_id ===
          connection.to_system_block_component_id,
      )!
    // A label beside the return must preserve the compact semicircular loop.
    expect(loop.route).toHaveLength(5)
    expect(
      loop.route.filter((point) => point.cubic_bezier_control_points).length,
    ).toBe(2)
    // Keep the label close to the circular return in both orientations. The
    // horizontal distance includes half of the unrotated "Watchdog" text.
    const tip = loop.route[2]
    const label = loop.label_anchor_center!
    const sideFacing = loop.route[0].x === loop.route.at(-1)!.x
    const axis = sideFacing ? "x" : "y"
    const gap =
      (label[axis] - tip[axis]) * Math.sign(tip[axis] - loop.route[0][axis])
    expect(gap).toBeGreaterThan(0)
    expect(gap).toBeLessThanOrEqual(sideFacing ? 8 : 3.5)
    await expect(
      convertCircuitJsonToSystemSvg(json, { width: 700 }),
    ).toMatchSvgSnapshot(
      import.meta.path,
      `system-blocks-rounded-${direction}`,
      { diffThresholdPercent: 0 },
    )
  }
})
