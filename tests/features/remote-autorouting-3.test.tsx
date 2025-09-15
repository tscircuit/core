import { test, expect } from "bun:test";
import { serve } from "bun";
import { getTestFixture } from "../fixtures/get-test-fixture";
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server";

test.skip("remote autorouter 3 cloud-auto", async () => {
  const { autoroutingServerUrl } = getTestAutoroutingServer();

  const { circuit } = getTestFixture();

  circuit.add(
    <board width="20mm" height="20mm" autorouter="auto-cloud">
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
  expect(circuit.selectAll("trace").length).toBeGreaterThan(0);
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
