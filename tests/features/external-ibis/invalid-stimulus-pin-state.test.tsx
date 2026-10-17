import { expect, test } from "bun:test"
import type { IbisPinRunState } from "@tscircuit/props"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("traffic requires an explicitly enabled output in its own experiment", async () => {
  const invalidPinStates: Record<string, IbisPinRunState>[] = [
    {},
    { ".U1 > .pin1": { mode: "input" } },
    { ".U1 > .pin1": { mode: "output", enabled: false } },
  ]
  for (const ibisPinStates of invalidPinStates) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board routingDisabled>
        <chip name="U1" footprint="soic4" />
        <analog.transientsimulation
          name="other"
          executionMode="external"
          duration="20ns"
          ibisPinStates={{ ".U1 > .pin1": { mode: "output", enabled: true } }}
        />
        <analog.transientsimulation
          name="run"
          executionMode="external"
          duration="20ns"
          ibisPinStates={ibisPinStates}
        />
        <analog.digitalstimulus
          name="data"
          simulationRef=".run"
          drives=".U1 > .pin1"
          unitInterval="2ns"
          startTime="0ns"
          initialState={0}
          pattern={{ type: "bits", bits: "01", repeat: true }}
        />
      </board>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      "declared as an enabled output",
    )
  }
})
