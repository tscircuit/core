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
    await expect(
      convertCircuitJsonToSystemSvg(json, { width: 700 }),
    ).toMatchSvgSnapshot(
      import.meta.path,
      `system-blocks-rounded-${direction}`,
      { diffThresholdPercent: 0 },
    )
  }
})
