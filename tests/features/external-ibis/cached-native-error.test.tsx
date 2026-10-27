import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ordinary cached failed simulations still allow PCB rendering", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        native: {
          async simulate(): Promise<{ simulationResultCircuitJson: never[] }> {
            throw new Error("solver failed")
          },
        },
      },
    },
  })
  circuit.add(
    <board routingDisabled>
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <resistor name="R1" resistance="1k" footprint="0402" />
        <voltageprobe name="out" connectsTo=".R1 > .pin1" />
        <analog.transientsimulation spiceEngine="native" duration="1ms" />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.source_component.list()).toHaveLength(1)
})
