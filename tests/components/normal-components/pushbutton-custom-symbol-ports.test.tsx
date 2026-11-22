import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pushbutton with custom symbol ports does not crash or inject default pins", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board>
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
              schStemLength={0.4}
            />
            <port
              name="pin7"
              pinNumber={7}
              direction="right"
              schX={1}
              schY={0}
              schStemLength={0.4}
            />
          </symbol>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const component = circuit.db.source_component
    .list()
    .find((c) => c.name === "SW1")!
  expect(component).toBeTruthy()

  const pins = circuit.db.source_port
    .list()
    .filter((port) => port.source_component_id === component.source_component_id)
    .map((port) => port.pin_number)
    .sort((a, b) => a! - b!)

  // Custom symbol declares only pins 3 and 7; no default pins 1 & 2 injected.
  expect(pins).toEqual([3, 7])
})