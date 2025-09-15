import { it, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

it("should render a solderjumper with pinlabels and bridgedPins using labels", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="20mm" height="20mm">
      <solderjumper
        name="SJ1"
        footprint="solderjumper3_bridged12"
        pinLabels={{
          "1": "SET",
          "2": "OUT",
          "3": "GND",
        }}
        bridgedPins={[["SET", "OUT"]]}
        pcbX={0}
        pcbY={0}
        schX={0}
        schY={0}
      />
    </board>,
  );

  await circuit.renderUntilSettled();

  const j1 = circuit.selectOne("solderjumper.SJ1") as any;
  const internallyConnectedPins = j1._getInternallyConnectedPins();
  expect(internallyConnectedPins).toHaveLength(1);
  expect(
    internallyConnectedPins[0].map((p: any) => p.props.name).sort(),
  ).toEqual(["OUT", "SET"].sort());

  expect(circuit).toMatchPcbSnapshot(import.meta.path);
  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
