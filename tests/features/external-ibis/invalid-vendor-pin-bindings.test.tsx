import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("IBIS references and model selections must name mapped vendor pins", async () => {
  for (const invalidBinding of [
    { ibisPinNameToReferencePortLabels: { "2": { pullup: "VCC" } } },
    { ibisPinNameToModelName: { "2": "BUFFER" } },
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
          ibisModelAsset={{
            project_relative_path: "models/model.ibs",
            url: "https://example.com/model.ibs",
            mimetype: "text/plain",
          }}
          ibisComponentName="BUFFER"
          ibisPinNameToPortLabel={{ "1": "DATA" }}
          modelValueCorner="typical"
          includePackageParasitics={false}
          {...invalidBinding}
        />
      </board>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      'IBIS pin "2" is referenced but not present in ibisPinNameToPortLabel',
    )
  }
})
