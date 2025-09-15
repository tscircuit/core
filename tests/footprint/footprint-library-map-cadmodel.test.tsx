import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json";
import type { CadComponent } from "circuit-json";

test("footprint library map cadModel", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => ({
          footprintCircuitJson: external0402Footprint,
          cadModel: { wrlUrl: "https://example.com/model.wrl" },
        }),
      },
    },
  });

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="kicad:R_0402_1005Metric"
        pcbX={0}
      />
    </board>,
  );

  await circuit.renderUntilSettled();

  const cad_component = circuit
    .getCircuitJson()
    .find((el): el is CadComponent => el.type === "cad_component");

  expect(cad_component?.model_wrl_url).toBe("https://example.com/model.wrl");
});
