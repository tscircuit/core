import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

const orientations = [
  "vertical",
  "horizontal",
  "pos_top",
  "pos_bottom",
  "pos_left",
  "pos_right",
  "neg_top",
  "neg_bottom",
  "neg_left",
  "neg_right",
] as const;

test("polarized capacitor schOrientation", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="30mm" height="10mm" schMaxTraceDistance={1}>
      {orientations.map((o, i) => (
        <capacitor
          key={o}
          name={`C_${o}`}
          capacitance="1uF"
          polarized
          schOrientation={o}
          schX={(i % 5) * 3}
          schY={i < 5 ? 0 : 5}
          connections={{ pos: "net.POS", neg: "net.NEG" }}
        />
      ))}
    </board>,
  );

  circuit.render();

  const symbolNames = circuit.db.schematic_component
    .list()
    .map((c) => c.symbol_name);

  expect(symbolNames).toEqual([
    "capacitor_polarized_down",
    "capacitor_polarized_right",
    "capacitor_polarized_down",
    "capacitor_polarized_up",
    "capacitor_polarized_right",
    "capacitor_polarized_left",
    "capacitor_polarized_up",
    "capacitor_polarized_up",
    "capacitor_polarized_left",
    "capacitor_polarized_right",
  ]);

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
