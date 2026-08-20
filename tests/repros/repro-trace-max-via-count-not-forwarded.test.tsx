import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A trace can explicitly forbid vias with maxViaCount={0}. The source trace
// stores that constraint, but the SimpleRouteJson connection sent to the
// autorouter does not preserve it.
test.failing(
  "trace maxViaCount is preserved in the autorouter input",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="12mm" height="8mm">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbY={0}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={4}
          pcbY={0}
        />
        <trace
          name="NO_VIAS"
          from=".R1 > .pin2"
          to=".R2 > .pin1"
          maxViaCount={0}
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
      circuitJson: circuit
        .getCircuitJson()
        .filter((element) => element.type !== "pcb_trace"),
    })
    expect(simpleRouteJson.connections).toHaveLength(1)
    const connection = simpleRouteJson.connections[0]
    expect((connection as { maxViaCount?: number }).maxViaCount).toBe(0)
  },
)
