import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("board information silkscreen added from platform config", async () => {
  const { circuit } = getTestFixture({
    platform: {
      projectName: "TestProj",
      version: "1.0.0",
      url: "https://example.com",
      printBoardInformationToSilkscreen: true,
    },
  });

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
    </board>,
  );

  await circuit.renderUntilSettled();

  expect(
    circuit.db.pcb_silkscreen_text
      .list()
      .some((elm) => elm.text === "TestProj\nv1.0.0\nhttps://example.com"),
  ).toBeTruthy();

  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
