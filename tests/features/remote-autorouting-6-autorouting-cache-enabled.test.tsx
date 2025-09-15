import { test, expect } from "bun:test";
import { getTestFixture } from "../fixtures/get-test-fixture";
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server";

test("remote-autorouting-6 with caching enabled", async () => {
  const { autoroutingServerUrl } = getTestAutoroutingServer({
    requireServerCacheEnabled: true,
  });

  const { circuit } = getTestFixture();

  // Create a basic circuit that needs routing
  circuit.add(
    <board
      width="20mm"
      height="20mm"
      autorouter={{
        serverUrl: autoroutingServerUrl,
        serverCacheEnabled: true,
      }}
    >
      <chip name="U1" footprint="soic8" pcbX={5} pcbY={0} />
      <resistor
        name="R1"
        pcbX={-5}
        pcbY={0}
        resistance={100}
        footprint="0402"
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  );

  await circuit.renderUntilSettled();

  // Verify routing request was made
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0);
});
