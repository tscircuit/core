import { expect, it } from "bun:test";
import type { Via } from "lib/components";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

it("should create a Via component with correct properties", () => {
  const { project } = getTestFixture();

  project.add(
    <board width="10mm" height="10mm">
      <via
        pcbX="0mm"
        pcbY="0mm"
        holeDiameter="1mm"
        outerDiameter="2mm"
        fromLayer="top"
        toLayer="bottom"
      />
    </board>
  );

  project.render();

  const via = project.selectOne("via") as Via;

  expect(via).not.toBeNull();
  expect(via.props.pcbX).toBe("0mm");
});
