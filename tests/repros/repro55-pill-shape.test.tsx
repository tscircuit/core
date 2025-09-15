import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
import { getTestFootprintServer } from "tests/fixtures/get-test-footprint-server";
import jstConnector from "tests/fixtures/assets/external-jst-ph-b2b-footprint.json";

test("repro55: pill shape", async () => {
  const footprintServer = getTestFootprintServer(jstConnector);
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async (footprintName: string) => {
          const url = `${footprintServer.url}/${footprintName}.circuit.json`;
          const res = await fetch(url);
          return { footprintCircuitJson: await res.json() };
        },
      },
    },
  });

  circuit.add(
    <board>
      <chip
        name="J100"
        footprint="kicad:Connector_JST/JST_PH_B2B-PH-K_1x02_P2.00mm_Vertical"
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
        }}
        connections={{
          pin1: "net.VCC",
          pin2: "net.GND",
        }}
      />
    </board>,
  );

  await circuit.renderUntilSettled();

  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
