import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pushbutton with custom symbol renders without crash and without extra default pins", async () => {
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

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(0)

  const ports = circuit.db.source_port.list()
  expect(ports.map((p) => p.pin_number)).toEqual([3, 7])
})

test("pushbutton with custom symbol supports connecting to its custom pins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <pushbutton
        name="SW1"
        pcbX={5}
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
      <trace from=".R1 > .pin1" to=".SW1 > .pin3" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(0)

  const traces = circuit.db.source_trace.list()
  expect(traces.length).toBeGreaterThan(0)
})
