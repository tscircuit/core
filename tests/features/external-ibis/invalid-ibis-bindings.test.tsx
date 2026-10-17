import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("IBIS models reject missing and ambiguous physical component or pin selectors", async () => {
  for (const componentRef of [".missing", "chip", ".U1"]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board routingDisabled>
        <chip name="U1" footprint="soic4" pinLabels={{ pin1: "DATA" }} />
        <chip name="U2" footprint="soic4" />
        <ibismodel
          componentRef={componentRef}
          source={{ file: "model.ibs" }}
          component="BUFFER"
          pinMap={{ "1": "MISSING" }}
          corner="typical"
          packagePolicy="omit"
        />
      </board>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      componentRef === ".U1" ? "physical source pin" : "identify one component",
    )
  }
})
