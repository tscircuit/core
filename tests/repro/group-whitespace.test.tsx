import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

// Reproduce issue: whitespace immediately after <group> tag should be ignored

test("group with whitespace after tag does not crash", () => {
  const { circuit } = getTestFixture();
  circuit.add(
    <board>
      <group>
        {" "}
        {/* comment */}
        <resistor name="R1" footprint="0402" resistance={1000} />
      </group>
    </board>,
  );
  expect(() => circuit.render()).not.toThrow();
});
