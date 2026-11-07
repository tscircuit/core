import { expect, test } from "bun:test"
import { systemblock } from "lib"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { assertSystemGeometry } from "./assert-system-geometry"

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
    expect(
      circuit.db.system_block_connection
        .list()
        .every((connection) =>
          connection.route.some((point) => point.cubic_bezier_control_points),
        ),
    ).toBe(true)
    const loop = circuit.db.system_block_connection
      .list()
      .find(
        (connection) =>
          connection.from_system_block_component_id ===
          connection.to_system_block_component_id,
      )!
    // Optimized landing slots and a reserved on-wire label may require a
    // rounded rectangular return instead of the compact semicircle. The
    // dedicated self-loop geometry test covers the semicircle when it fits.
    expect(
      loop.route.filter((point) => point.cubic_bezier_control_points).length,
    ).toBeGreaterThanOrEqual(2)
    await expect(
      convertCircuitJsonToSystemSvg(json, { width: 700 }),
    ).toMatchSvgSnapshot(
      import.meta.path,
      `system-blocks-rounded-${direction}`,
      { diffThresholdPercent: 0 },
    )
  }
})
