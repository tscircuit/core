import { it, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

it("should render a jumper with pinrow4 footprint", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="20mm" height="20mm" schMaxTraceDistance={5}>
      <solderjumper
        name="J1"
        footprint="solderjumper2"
        pinCount={2}
        pcbX={0}
        pcbY={0}
        schX={0}
        schY={0}
      />
      <solderjumper
        name="J2"
        footprint="solderjumper2_bridged12"
        pinCount={2}
        bridgedPins={[["1", "2"]]}
        pcbX={4}
        pcbY={4}
        schX={2}
        schY={2}
        layer={"bottom"}
        schRotation={90}
      />
      <solderjumper
        name="J3"
        footprint="solderjumper3_bridged23"
        pinCount={3}
        bridgedPins={[["3", "2"]]}
        pcbX={-4}
        layer={"bottom"}
        pcbY={-4}
        schX={-2}
        schY={-2}
      />
      <solderjumper
        name="J4"
        footprint="solderjumper3_bridged123"
        pinCount={3}
        bridgedPins={[
          ["1", "2"],
          ["2", "3"],
        ]}
        pcbX={4}
        pcbY={-4}
        schX={2}
        schY={-2}
      />
      <solderjumper
        name="J5"
        footprint="solderjumper2_bridged12"
        pinCount={2}
        bridgedPins={[["pin1", "pin2"]]}
        pcbX={0}
        pcbY={8}
        schX={0}
        schY={4}
      />
    </board>,
  );

  circuit.render();

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
