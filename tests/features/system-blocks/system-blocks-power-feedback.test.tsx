import { expect, test } from "bun:test"
import { systemblock } from "lib"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { assertSystemGeometry } from "./assert-system-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("TSX power fanout, parallel interfaces, cycles, and self-loops", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <systemblock.page name="control" direction="down">
      <systemblock.component name="supply" displayName="3.3 V supply" />
      <systemblock.group name="control-loop" displayName="Motor control">
        <systemblock.component
          name="mcu"
          displayName="Controller"
          description="Runs the control loop"
        />
        <systemblock.component name="driver" displayName="Motor driver" />
        <systemblock.component name="encoder" displayName="Position encoder" />
      </systemblock.group>
      <systemblock.connection
        from="supply"
        to="mcu"
        kind="power"
        label="3.3 V"
      />
      <systemblock.connection
        from="supply"
        to="encoder"
        kind="power"
        label="3.3 V"
      />
      <systemblock.connection from="mcu" to="driver" label="PWM" />
      <systemblock.connection
        from="mcu"
        to="driver"
        label="Enable"
        direction="none"
      />
      <systemblock.connection from="driver" to="encoder" label="Rotation" />
      <systemblock.connection from="encoder" to="mcu" label="Feedback" />
      <systemblock.connection from="mcu" to="mcu" label="Watchdog" />
    </systemblock.page>,
  )
  circuit.render()
  assertSystemGeometry(circuit.getCircuitJson())
  for (const connection of circuit.db.system_block_connection.list()) {
    expect(
      connection.route.some((point) => point.cubic_bezier_control_points),
    ).toBe(true)
    expect(connection.is_signal).toBe(!connection.is_power)
  }
  return expect(
    convertCircuitJsonToSystemSvg(circuit.getCircuitJson(), { width: 800 }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
