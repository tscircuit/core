import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("IBIS pin names cannot bind the same physical port through aliases", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip name="U1" footprint="soic4" pinLabels={{ pin1: "DATA" }} />
      <ibismodel
        componentRef=".U1"
        ibisModelAsset={{
          project_relative_path: "models/chip.ibs",
          url: "https://example.com/chip.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="DRIVER"
        ibisPinNameToPortLabel={{ "1": "pin1", "2": "DATA" }}
        modelValueCorner="typical"
        includePackageParasitics={false}
      />
    </board>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'IBIS pins "1" and "2" on ".U1" resolve to the same physical pin',
  )
})
