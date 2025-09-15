import { test, expect } from "bun:test";
import type { Chip } from "lib/components";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

const HigherOrderComponent = () => {
  return (
    <group>
      <chip name="U1" footprint="soic8" />
    </group>
  );
};

test("should create a circuit with a higher-order component", async () => {
  const { circuit } = getTestFixture();

  // circuit.add(<chip name="U1" footprint="soic8" />)
  circuit.add(<HigherOrderComponent />);

  circuit.render();

  const chip = circuit.selectOne("chip") as Chip;

  expect(chip).not.toBeNull();
  expect(chip.props.name).toBe("U1");
});
