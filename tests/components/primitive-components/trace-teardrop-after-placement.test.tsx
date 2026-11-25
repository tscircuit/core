import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "autorouted trace has teardrops after placement checks",
  async () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={9} height={4}>
        <testpoint
          name="TP1"
          footprintVariant="pad"
          padDiameter={0.8}
          pcbX={-2}
        />
        <testpoint
          name="TP2"
          footprintVariant="pad"
          padDiameter={0.8}
          pcbX={2}
        />
        <trace from="TP1.1" to="TP2.1" thickness={0.2} pcbTeardrops />
        <pcbnotetext
          pcbY={1.4}
          text="Expected teardrops at both pads"
          fontSize={0.3}
        />
      </board>,
    )

    await circuit.renderUntilSettled()
    await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)

    const pcbTraces = circuit.db.pcb_trace.list()
    expect(pcbTraces).toHaveLength(1)
    expect(
      pcbTraces[0].route.some(
        (point) => point.route_type === "wire" && point.width > 0.2,
      ),
    ).toBe(true)
  },
)
