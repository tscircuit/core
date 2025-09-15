import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("footprint library map error attaches to db", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => {
          throw new Error("footprint not found");
        },
      },
    },
  });

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="kicad:Resistor_SMD.pretty/R_0402_1005Metric"
        pcbX={0}
      />
    </board>,
  );

  await circuit.renderUntilSettled();

  const errors = circuit.db.external_footprint_load_error.list();
  expect(errors).toHaveLength(1);
  const r1 = circuit.selectOne(".R1") as any;
  expect(errors[0].message).toContain("footprint not found");
  expect(errors[0].message).toContain(
    "kicad:Resistor_SMD.pretty/R_0402_1005Metric",
  );
  expect(errors[0].message).toContain(r1.getString());
  expect(errors[0].footprinter_string).toBe(
    "kicad:Resistor_SMD.pretty/R_0402_1005Metric",
  );
});
