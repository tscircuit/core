import { it, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

it("should render a jumper with pinrow4 footprint", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <jumper
        name="J1"
        footprint="pinrow4"
        pcbX={0}
        pcbY={0}
        schX={0}
        schY={0}
      />
      <jumper
        name="J2"
        footprint="pinrow4_doublesidedpinlabel"
        pinLabels={{
          pin1: "ONE",
          pin2: "TWO",
          pin3: "THREE",
          pin4: "FOUR",
        }}
        pcbX={0}
        pcbY={-4}
        schX={0}
        schY={-4}
      />
    </board>,
  );

  circuit.render();

  expect(circuit).toMatchPcbSnapshot(import.meta.path);
  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});

it("It should render a jumper with the pinrow4 footprint and rows", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <jumper
        name="J1"
        footprint="pinrow6_female_rows2"
        pcbY={-2}
        schX={0}
        schY={0}
      />
    </board>,
  );

  circuit.render();
  expect(circuit).toMatchPcbSnapshot(`${import.meta.path}rows`);
  expect(circuit).toMatchSchematicSnapshot(`${import.meta.path}rows`);
});
