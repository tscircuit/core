import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pushbutton with custom symbol renders without crash and preserves custom ports", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <pushbutton
        name="SW1"
        symbol={
          <symbol>
            <schematicrect width={1.2} height={0.5} strokeWidth={0.03} />
            <port
              name="pin3"
              pinNumber={3}
              direction="left"
              schX={-1}
              schY={0}
            />
            <port
              name="pin7"
              pinNumber={7}
              direction="right"
              schX={1}
              schY={0}
            />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errs = circuit.db.source_failed_to_create_component_error.list()
  expect(errs).toHaveLength(0)

  const ports = circuit.db.source_port.list()
  const pinNumbers = ports.map((p) => p.pin_number).sort((a, b) => a! - b!)
  expect(pinNumbers).toEqual([3, 7])
})
