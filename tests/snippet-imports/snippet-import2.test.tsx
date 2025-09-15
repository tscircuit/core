import { test, expect } from "bun:test";
import { importSnippet } from "@tscircuit/import-snippet";
import { Circuit } from "lib";
import * as tscircuitCore from "lib";

test.skip("snippet-import2-usb-c-flashlight", async () => {
  const UsbCFlashlight = await importSnippet("seveibar/usb-c-flashlight", {
    dependencies: {
      "@tscircuit/core": tscircuitCore,
    },
  });

  const circuit = new Circuit();

  circuit.add(<UsbCFlashlight />);

  await circuit.renderUntilSettled();

  const circuitJson = circuit.getCircuitJson();
  expect(circuitJson).toBeDefined();
});
