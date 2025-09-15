import { test, expect } from "bun:test";
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
import { su } from "@tscircuit/circuit-json-util";

test("subcircuit_id added to pcb_trace output from autorouter", async () => {
  const { circuit } = await getTestFixture();
  const { autoroutingServerUrl } = getTestAutoroutingServer();

  const cloudAutorouterConfig = {
    serverUrl: autoroutingServerUrl,
  } as const;

  circuit.add(
    <board width="10mm" height="10mm" autorouter={cloudAutorouterConfig}>
      <subcircuit name="S1">
        <resistor
          resistance="1k"
          footprint="0402"
          name="R1"
          schX={3}
          pcbX={3}
        />
        <resistor
          resistance="1k"
          footprint="0402"
          name="R2"
          schX={3}
          pcbX={3}
          pcbY={2}
        />
        <trace from=".R1 .pin1" to=".R2 .pin2" />
      </subcircuit>
      <subcircuit name="S2">
        <capacitor
          capacitance="1000pF"
          footprint="0603"
          name="C1"
          schX={-3}
          pcbX={-3}
        />
        <trace from=".C1 .pin1" to=".C1 .pin2" />
      </subcircuit>
      <trace from=".S1 .R1 > .pin1" to=".S2 .C1 > .pin1" />
    </board>,
  );

  await circuit.renderUntilSettled();

  const circuitJson = circuit.getCircuitJson();
  const pcb_trace = su(circuitJson).pcb_trace.list();
  const subcircuit_ids = pcb_trace.filter((t) => t.subcircuit_id);

  // All traces should have a subcircuit_id
  expect(subcircuit_ids.length).toBe(pcb_trace.length);
});
