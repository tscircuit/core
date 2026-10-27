import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("restoring an IBIS model with an unmappable reference fails loudly", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <subcircuit
        name="Broken"
        circuitJson={[
          {
            type: "simulation_ibis_model",
            simulation_ibis_model_id: "simulation_ibis_model_0",
            source_component_id: "source_component_missing",
            ibis_model_asset: {
              project_relative_path: "models/model.ibs",
              url: "https://example.com/model.ibs",
              mimetype: "text/plain",
            },
            ibis_component_name: "DRIVER",
            ibis_pin_name_to_source_port_id: { "1": "source_port_missing" },
            model_value_corner: "typical",
            include_package_parasitics: true,
          },
        ]}
      />
    </board>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "Cannot restore simulation records: unable to remap source_component_id safely.",
  )
})
