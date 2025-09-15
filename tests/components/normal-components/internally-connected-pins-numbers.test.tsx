import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("internallyConnectedPins with numbers should convert to pin names", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      {/* Test with pure numbers */}
      <pushbutton
        name="SW1"
        internallyConnectedPins={[
          [1, 2],
          [3, 4],
        ]}
        schX={0}
        schY={0}
        footprint="pushbutton_id1.3mm_od2mm"
      />

      {/* Test with mixed strings and numbers */}
      <pushbutton
        name="SW2"
        internallyConnectedPins={[
          ["pin1", 2],
          [3, "pin4"],
        ]}
        schX={0}
        schY={2}
        footprint="pushbutton_id1.3mm_od2mm"
      />

      {/* Test with pure strings */}
      <pushbutton
        name="SW3"
        internallyConnectedPins={[
          ["pin1", "pin2"],
          ["pin3", "pin4"],
        ]}
        schX={0}
        schY={4}
        footprint="pushbutton_id1.3mm_od2mm"
      />
    </board>,
  );

  await circuit.renderUntilSettled();

  // Check that all pushbuttons were processed correctly
  const sw1 = circuit.selectOne("pushbutton.SW1") as any;
  const sw2 = circuit.selectOne("pushbutton.SW2") as any;
  const sw3 = circuit.selectOne("pushbutton.SW3") as any;

  // Verify internal connections for SW1 (numbers)
  const sw1InternalPins = sw1._getInternallyConnectedPins();
  expect(sw1InternalPins).toHaveLength(2);
  expect(sw1InternalPins[0].map((p: any) => p.props.name).sort()).toEqual([
    "pin1",
    "pin2",
  ]);
  expect(sw1InternalPins[1].map((p: any) => p.props.name).sort()).toEqual([
    "pin3",
    "pin4",
  ]);

  // Verify internal connections for SW2 (mixed)
  const sw2InternalPins = sw2._getInternallyConnectedPins();
  expect(sw2InternalPins).toHaveLength(2);
  expect(sw2InternalPins[0].map((p: any) => p.props.name).sort()).toEqual([
    "pin1",
    "pin2",
  ]);
  expect(sw2InternalPins[1].map((p: any) => p.props.name).sort()).toEqual([
    "pin3",
    "pin4",
  ]);

  // Verify internal connections for SW3 (strings)
  const sw3InternalPins = sw3._getInternallyConnectedPins();
  expect(sw3InternalPins).toHaveLength(2);
  expect(sw3InternalPins[0].map((p: any) => p.props.name).sort()).toEqual([
    "pin1",
    "pin2",
  ]);
  expect(sw3InternalPins[1].map((p: any) => p.props.name).sort()).toEqual([
    "pin3",
    "pin4",
  ]);

  // Verify the internallyConnectedPinNames getter processes numbers correctly
  expect(sw1.internallyConnectedPinNames).toEqual([
    ["pin1", "pin2"],
    ["pin3", "pin4"],
  ]);
  expect(sw2.internallyConnectedPinNames).toEqual([
    ["pin1", "pin2"],
    ["pin3", "pin4"],
  ]);
  expect(sw3.internallyConnectedPinNames).toEqual([
    ["pin1", "pin2"],
    ["pin3", "pin4"],
  ]);

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
