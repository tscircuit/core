import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a named part cable endpoint requires an explicit connector model", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.part name="MOTOR">
        <assembly.referencesurface name="pigtail" />
      </assembly.part>
      <board width={30} height={20} routingDisabled>
        <connector
          name="J1"
          standard="jst_ph"
          pinCount={3}
          footprint="jst3_ph"
        />
      </board>
      <assembly.cable name="HARNESS" from=".J1" to="MOTOR.pigtail" />
    </assembly.device>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'endpoint "MOTOR.pigtail" requires an explicit model to define its connector',
  )
  expect(circuit.db.cad_cable.list()).toHaveLength(0)
})
