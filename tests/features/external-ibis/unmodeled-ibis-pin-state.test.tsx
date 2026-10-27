import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("IBIS pin states require a model for the selected physical pin", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip name="U1" footprint="soic4" pinLabels={{ pin1: "DATA" }} />
      <analog.transientsimulation
        name="run"
        spiceEngine="pcb_spice"
        duration="20ns"
        ibisPinStates={{ ".U1 > .DATA": { isOutput: false } }}
      />
    </board>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'pin ".U1 > .DATA" requires exactly one IBIS model binding',
  )
})
