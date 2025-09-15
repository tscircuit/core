import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

// Regression test: schematictext global position should include parent group schX/schY

test("schematictext inside translated group has global position offset", () => {
  const { project } = getTestFixture();

  project.add(
    <board width="10mm" height="10mm">
      <group name="G" schX={5} schY={7}>
        <schematictext text="hello" schX={2} schY={3} />
      </group>
    </board>,
  );

  project.render();

  const texts = project.db.schematic_text.list();
  expect(texts.length).toBe(1);
  expect(texts[0].position.x).toBe(7);
  expect(texts[0].position.y).toBe(10);
});
