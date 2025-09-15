import { it, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

it("connects all pins when bridged is true", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <solderjumper name="SJ1" pinCount={3} bridged />
    </board>,
  );

  await circuit.renderUntilSettled();

  const sj1 = circuit.selectOne("solderjumper.SJ1") as any;
  const internallyConnectedPins = sj1._getInternallyConnectedPins();
  expect(internallyConnectedPins).toHaveLength(1);
  expect(
    internallyConnectedPins[0].map((p: any) => p.props.name).sort(),
  ).toEqual(["pin1", "pin2", "pin3"].sort());

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
