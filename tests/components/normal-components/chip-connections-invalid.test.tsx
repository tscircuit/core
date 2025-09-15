import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
import { sel } from "lib/sel";

test("Chip not having name messes up the connections, uses the pin of the first chip", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board>
      {/* @ts-ignore */}
      <chip
        pinLabels={{
          pin1: "LABEL1",
          pin2: "LABEL2",
        }}
      />
      {/* @ts-ignore */}
      <chip
        pinLabels={{
          pin1: "LABEL3",
          pin2: "LABEL4",
        }}
        connections={{
          pin1: sel.net.GND,
        }}
      />
    </board>,
  );

  await circuit.renderUntilSettled();

  const circuitJson = circuit.getCircuitJson();
  const source_trace_not_connected_errors = circuitJson.filter(
    (item: any) => item.type === "source_trace_not_connected_error",
  );

  expect(source_trace_not_connected_errors).toMatchInlineSnapshot(`
    [
      {
        "error_type": "source_trace_not_connected_error",
        "message": "Could not find port for selector "chip.unnamed_chip1 > port.pin1". Component "chip.unnamed_chip1 > port" not found",
        "selectors_not_found": [
          "chip.unnamed_chip1 > port.pin1",
        ],
        "source_group_id": "source_group_0",
        "source_trace_id": undefined,
        "source_trace_not_connected_error_id": "source_trace_not_connected_error_0",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "source_trace_not_connected_error",
      },
    ]
  `);
});
