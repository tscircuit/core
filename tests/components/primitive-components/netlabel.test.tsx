import { expect, it } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

it("should render a net label", async () => {
  const { project } = getTestFixture();

  project.add(
    <board width="10mm" height="10mm">
      <netlabel net="net1" schX="1mm" schY="1mm" />
    </board>,
  );

  project.render();

  expect(project.db.schematic_net_label.list()).toHaveLength(1);
});
