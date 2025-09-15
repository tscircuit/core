import { expect, test } from "bun:test";
import { getTestFixture } from "../fixtures/get-test-fixture";
test("Schematic trace double hop", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board
      width="25mm"
      height="30mm"
      autorouter={{
        serverCacheEnabled: false,
      }}
      schTraceAutoLabelEnabled
      schAutoLayoutEnabled
      schMaxTraceDistance={5}
    >
      <resistor name="R1" resistance="10k" footprint="1206" schX={0} schY={0} />
      <resistor name="R2" resistance="10k" footprint="1206" schX={3} schY={0} />
      <resistor name="R3" resistance="10k" footprint="1206" schX={6} schY={0} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <trace from=".R2 > .pin2" to=".R3 > .pin2" />
      <trace from=".R3 > .pin2" to=".R2 > .pin2" />
    </board>,
  );

  circuit.render();

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
