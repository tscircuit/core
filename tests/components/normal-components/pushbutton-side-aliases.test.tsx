import { expect, test } from "bun:test"
import { sel } from "lib/sel"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<pushbutton /> resolves side1 and side2 aliases across connections and selectors", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <pushbutton
        name="SW1"
        footprint="pushbutton"
        internallyConnectedPins={[
          ["pin1", "pin2"],
          ["pin3", "pin4"],
        ]}
        connections={{
          side1: sel.R1.pin1,
        }}
      />
      <resistor name="R1" resistance="1k" footprint="0402" />
      <trace from={sel.SW1.side2} to={sel.R1.pin2} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const side1Port = circuit.selectOne(sel.SW1.side1)
  const side2Port = circuit.selectOne(sel.SW1.side2)
  expect(side1Port?.props.name).toBe("pin1")
  expect(side2Port?.props.name).toBe("pin3")

  const sourceTraces = circuit.db.source_trace.list()
  expect(sourceTraces).toHaveLength(2)
})
