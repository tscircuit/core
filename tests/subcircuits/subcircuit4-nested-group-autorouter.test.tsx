import React from "react";
import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server";

test("Nested group within a subcircuit triggers autorouter only once", async () => {
  const { autoroutingServerUrl } = getTestAutoroutingServer();

  const cloudAutorouterConfig = {
    serverUrl: autoroutingServerUrl,
    serverMode: "solve-endpoint",
    inputFormat: "simplified",
  } as const;
  const { circuit } = getTestFixture();

  // Count the number of times the autorouter is triggered
  let autorouterCallCount = 0;
  circuit.on("asyncEffect:start", (event) => {
    if (event.effectName === "make-http-autorouting-request") {
      autorouterCallCount++;
    }
  });

  // Add a board with autorouter configuration
  circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit
        name="SC1"
        autorouter={{
          serverUrl: autoroutingServerUrl,
        }}
      >
        <group name="G1">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={-5}
            pcbY={0}
          />
          <capacitor
            name="C1"
            capacitance="100nF"
            footprint="0805"
            pcbX={5}
            pcbY={0}
          />
          <trace from=".R1 > .pin2" to=".C1 > .pin1" />
        </group>
      </subcircuit>
    </board>,
  );

  await circuit.renderUntilSettled();

  // Expect that the autorouter is called only once for the subcircuit,
  // not once for the nested group
  expect(autorouterCallCount).toBe(1);
});
