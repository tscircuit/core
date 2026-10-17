import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("IBIS references and model selections must name mapped vendor pins", async () => {
  for (const invalidBinding of [
    { references: { "2": { pullup: "VCC" } } },
    { modelSelections: { "2": "BUFFER" } },
  ]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board routingDisabled>
        <chip
          name="U1"
          footprint="soic4"
          pinLabels={{ pin1: "DATA", pin2: "VCC" }}
        />
        <ibismodel
          componentRef=".U1"
          source={{ file: "model.ibs" }}
          component="BUFFER"
          pinMap={{ "1": "DATA" }}
          corner="typical"
          packagePolicy="omit"
          {...invalidBinding}
        />
      </board>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      'IBIS pin "2" is referenced but not present in pinMap',
    )
  }
})
