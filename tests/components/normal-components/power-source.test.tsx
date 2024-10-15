import { expect, it } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

it("should render a power source", async () => {
  const { project } = getTestFixture();

  project.add(
    <board width="10mm" height="10mm">
      {/* <powersource name="pwr" voltage={5} schX={2} schY={3} pcbX={0} pcbY={0} /> */}
      <netalias net="net1" />
    </board>
  );

  project.render();
  console.log(project.getCircuitJson());
  expect(project.db.schematic_component.list()).toHaveLength(1);
  expect(project.db.schematic_port.list()).toHaveLength(2);
});
