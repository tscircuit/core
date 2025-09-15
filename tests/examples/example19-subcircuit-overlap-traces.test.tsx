import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
import { su } from "@tscircuit/circuit-json-util";
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server";

test("routingDisabled subcircuit prop should be inherited from parent and not have traces from the autorouter", async () => {
  const { circuit } = getTestFixture();
  const { autoroutingServerUrl } = getTestAutoroutingServer();

  const cloudAutorouterConfig = {
    serverUrl: autoroutingServerUrl,
    serverMode: "solve-endpoint",
    inputFormat: "simplified",
  } as const;

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <group subcircuit autorouter={cloudAutorouterConfig}>
        <resistor footprint="0402" resistance={1000} name="R1" pcbX={-2} />
        <resistor footprint="0402" resistance={1000} name="R2" pcbX={2} />
        <trace from=".R1 .1" to=".R2 .1" />
      </group>
    </board>,
  );

  await circuit.renderUntilSettled();

  const pcb_traces = su(circuit.getCircuitJson()).pcb_trace.list();
  expect(pcb_traces).toHaveLength(0);
});

test("Autorouter should inherit if the parent subcircuit has async autorouter enabled", async () => {
  const { circuit } = getTestFixture();
  const { autoroutingServerUrl } = getTestAutoroutingServer();

  const cloudAutorouterConfig = {
    serverUrl: autoroutingServerUrl,
    serverMode: "solve-endpoint",
    inputFormat: "simplified",
  } as const;

  circuit.add(
    <board width="10mm" height="10mm" autorouter={cloudAutorouterConfig}>
      <group subcircuit>
        <resistor footprint="0402" resistance={1000} name="R1" pcbX={-2} />
        <resistor footprint="0402" resistance={1000} name="R2" pcbX={2} />
        <trace from=".R1 .1" to=".R2 .1" />
      </group>
    </board>,
  );

  await circuit.renderUntilSettled();

  const source_traces = su(circuit.getCircuitJson()).source_trace.list();
  const pcb_traces = su(circuit.getCircuitJson()).pcb_trace.list();
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path);
});
