import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("footprint cutout", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board>
      <chip name="m2host" footprint="m2host" />
    </board>,
  );

  await circuit.renderUntilSettled();

  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
