import { expect, it } from "bun:test";
import { InvalidProps } from "lib/errors/InvalidProps";
import "lib/register-catalogue";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

it("Chip with pinrow footprint", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="20mm" height="10mm">
      <chip
        name="U1"
        schHeight={2}
        schWidth={2}
        footprint="pinrow8"
        pinLabels={{
          pin1: ["A1"],
          pin2: ["A2"],
          pin3: ["B1_1"],
          pin4: ["B1_2"],
          pin5: ["B2_1"],
          pin6: ["B2_2"],
          pin7: ["B3_1"],
          pin8: ["B3_2"],
        }}
      />
    </board>,
  );

  circuit.render();

  const chip = circuit.selectOne("chip");
  expect(chip).not.toBeNull();
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path);
});
