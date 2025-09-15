import { test, expect } from "bun:test";
import { fp } from "@tscircuit/footprinter";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
import { getTestFootprintServer } from "tests/fixtures/get-test-footprint-server";

test("footprint url is loaded", async () => {
  const footprintJson = fp.string("0402").soup();
  const { url } = getTestFootprintServer(footprintJson);
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint={url} />
    </board>,
  );

  await circuit.renderUntilSettled();

  const pads = circuit.db.pcb_smtpad.list();
  expect(pads.length).toBeGreaterThan(0);
});
