import { it, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
import { Transistor } from "lib/components/normal-components/Transistor";

it("should render a PNP and NPN transistor", async () => {
  const { circuit } = getTestFixture();
  circuit._featureMspSchematicTraceRouting = true;
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor
        name="Q1_NPN"
        type="npn"
        schRotation={90}
        schX={-2}
        connections={{
          collector: "net.collector",
          emitter: "net.emitter",
          base: "net.base",
        }}
      />
      <transistor
        name="Q2_PNP"
        type="pnp"
        schRotation={90}
        schX={3.5}
        connections={{
          collector: "net.collector",
          emitter: "net.emitter",
          base: "net.base",
        }}
      />
    </board>,
  );
  circuit.render();
  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
