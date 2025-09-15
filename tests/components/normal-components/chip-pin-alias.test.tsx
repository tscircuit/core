import { expect, it } from "bun:test";
import { InvalidProps } from "lib/errors/InvalidProps";
import "lib/register-catalogue";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

it("Chip with pin labels as strings and duplicates", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schHeight={2}
        schWidth={2}
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
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["B2_1", "B1_1"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["A1", "A2"],
          },
          topSide: {
            direction: "left-to-right",
            pins: ["B1_2", "B2_2"],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: ["B3_1", "B3_2"],
          },
        }}
      />
    </board>,
  );

  circuit.render();

  const chip = circuit.selectOne("chip");
  expect(chip).not.toBeNull();

  // Check if ports are created correctly in the database
  // const schematicPorts = circuit.db.schematic_port.list()
  // expect(schematicPorts).toHaveLength(8) // 2 pins per side * 4 sides

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path);
});

it.skip("Chip with pin labels as numbers, decimals and duplicates", async () => {
  const { circuit } = getTestFixture();

  try {
    circuit.add(
      <board width="10mm" height="10mm">
        <chip
          name="U1"
          schPinSpacing={0.75}
          schPinArrangement={{
            leftSide: {
              direction: "top-to-bottom",
              pins: [1, 2],
            },
            rightSide: {
              direction: "top-to-bottom",
              pins: [3, -4],
            },
            topSide: {
              direction: "left-to-right",
              pins: [2, 6.5],
            },
            bottomSide: {
              direction: "left-to-right",
              pins: [7, 7],
            },
          }}
          supplierPartNumbers={{
            lcsc: ["C165948"],
          }}
        />
      </board>,
    );
  } catch (e: unknown) {
    expect(e).toBeInstanceOf(InvalidProps);
    expect((e as InvalidProps).message).toContain("-4");
  }
});

// TODO
it.skip("Chip with pin labels as duplicates", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schPinSpacing={0.75}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["pin1", "pin2"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["pin3", "pin3", "pin3"],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: ["pin4", "pin2", "pin3"],
          },
        }}
        supplierPartNumbers={{
          lcsc: ["C165948"],
        }}
      />
    </board>,
  );

  circuit.render();

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path);
});
