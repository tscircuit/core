import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("renders rotated pill-shaped platedhole", async () => {
  const { circuit } = getTestFixture();

  const footprint = (
    <footprint>
      <platedhole
        shape="pill"
        rectPad
        outerWidth={8}
        outerHeight={10}
        holeWidth={3}
        holeHeight={5}
        portHints={["1"]}
        pcbRotation={45}
      />
    </footprint>
  );

  circuit.add(
    <board>
      <chip name="U2" layer="top" footprint={footprint} />
    </board>,
  );

  circuit.render();
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
