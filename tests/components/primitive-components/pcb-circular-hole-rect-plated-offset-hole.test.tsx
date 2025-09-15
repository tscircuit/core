import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("pcb circular hole rect plated offset hole", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width={10} height={10}>
      <platedhole
        shape="circular_hole_with_rect_pad"
        holeDiameter={2}
        rectPadWidth={4}
        rectPadHeight={4}
        pcbHoleOffsetX={1}
      />
    </board>,
  );

  circuit.render();

  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
