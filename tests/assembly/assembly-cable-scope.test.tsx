import { expect, test } from "bun:test"
import { Fragment } from "react"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("forward cable references stay inside their nearest device and emit independent paths", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      {[-20, 20].map((y) => (
        <Fragment key={y}>
          <assembly.device name={`DEVICE_${y}`}>
            <assembly.cable name="HARNESS" from=".J1" to=".J2" />
            <board width={50} height={25} pcbY={y} routingDisabled>
              <connector
                name="J1"
                standard="jst_ph"
                pinCount={4}
                pcbX={-15}
                footprint="jst4_ph"
              />
              <connector
                name="J2"
                standard="jst_ph"
                pinCount={4}
                pcbX={15}
                footprint="jst4_ph"
              />
            </board>
          </assembly.device>
        </Fragment>
      ))}
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const cables = circuit.db.cad_cable.list()
  expect(cables).toHaveLength(2)
  expect(
    new Set(
      cables.flatMap((c) => [
        c.from_source_component_id,
        c.to_source_component_id,
      ]),
    ).size,
  ).toBe(4)
  expect(cables[0]!.path[0]!.y).toBeCloseTo(-20, 4)
  expect(cables[1]!.path[0]!.y).toBeCloseTo(20, 4)
})
