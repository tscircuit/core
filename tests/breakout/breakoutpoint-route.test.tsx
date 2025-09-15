import React from "react";
import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server";
import { su } from "@tscircuit/circuit-json-util";

test("autorouter uses breakout point", async () => {
  const { circuit } = getTestFixture();
  const { autoroutingServerUrl } = getTestAutoroutingServer();

  circuit.add(
    <board width="20mm" height="20mm">
      <breakout autorouter={{ serverUrl: autoroutingServerUrl }}>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
        <capacitor
          name="C1"
          capacitance="1uF"
          footprint="0402"
          pcbX={2}
          pcbY={0}
        />
        <trace from="R1.2" to="C1.1" />
        <breakoutpoint connection="R1.1" pcbX={5} pcbY={5} />
      </breakout>
    </board>,
  );

  await circuit.renderUntilSettled();

  const pcb_trace = su(circuit.getCircuitJson()).pcb_trace.list();
  const hasPointNear = pcb_trace.some((t) =>
    t.route.some((pt) => Math.abs(pt.x - 5) < 0.6 && Math.abs(pt.y - 5) < 0.6),
  );
  expect(hasPointNear).toBe(true);
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
