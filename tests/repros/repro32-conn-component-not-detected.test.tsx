import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("repro32-conn-component-not-detected", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="25mm" height="30mm" routingDisabled>
      <pinheader
        name="conn"
        pinCount={4}
        gender="male"
        pitch="3.5mm"
        showSilkscreenPinLabels={true}
        pinLabels={["+", "-"]}
        pcbRotation={90}
        footprint="pinrow4_p3.5mm"
      />

      <resistor name="R1" resistance="10k" footprint="1206" pcbRotation={180} />

      <trace from=".R1 > .pin2" to=".conn > .pin1" thickness={0.2} />
    </board>,
  );

  circuit.render();

  // Test that the circuit renders without errors
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
  expect(circuit).toMatchSchematicSnapshot(import.meta.path);

  const circuitJson = circuit.getCircuitJson();
  const sourceComponents = circuitJson.filter(
    (c: any) => c.type === "source_component",
  );
  const traces = circuitJson.filter((c: any) => c.type === "source_trace");

  // Verify expected component states
  expect(sourceComponents.find((c: any) => c.name === "conn")).toBeUndefined();
  expect(sourceComponents.find((c: any) => c.name === "R1")).toBeDefined();
  expect(traces.length).toBe(0);

  // Verify circuit rendered successfully
  expect(circuitJson.length).toBeGreaterThan(0);
  expect(
    circuitJson.filter((c: any) => c.type === "schematic_component").length,
  ).toBeGreaterThan(0);
  expect(
    circuitJson.filter((c: any) => c.type === "pcb_component").length,
  ).toBeGreaterThan(0);

  // Check for errors in circuitJson
  const errorComponents = circuitJson.filter(
    (c: any) => c.type === "source_failed_to_create_component_error",
  );
  expect(errorComponents.length).toBeGreaterThan(0);

  const traceErrors = circuitJson.filter(
    (c: any) => c.type === "source_trace_not_connected_error",
  );
  expect(traceErrors.length).toBe(1);

  if (traceErrors[0].type === "source_trace_not_connected_error") {
    expect(traceErrors[0].selectors_not_found).toEqual([".conn > .pin1"]);
  } else {
    throw new Error("Unexpected error type");
  }
});
