import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("IBIS models reject missing and ambiguous physical component or pin selectors", async () => {
  for (const [componentRef, expectedError] of [
    [".missing", "identify one component"],
    ["chip", "identify one component"],
    [".U1", "physical source pin"],
  ]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board routingDisabled>
        <chip name="U1" footprint="soic4" pinLabels={{ pin1: "DATA" }} />
        <chip name="U2" footprint="soic4" />
        <ibismodel
          componentRef={componentRef}
          ibisModelAsset={{
            project_relative_path: "models/model.ibs",
            url: "https://example.com/model.ibs",
            mimetype: "text/plain",
          }}
          ibisComponentName="BUFFER"
          ibisPinNameToPortLabel={{ "1": "MISSING" }}
          modelValueCorner="typical"
          includePackageParasitics={false}
        />
      </board>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(expectedError)
  }
})
