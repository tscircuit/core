import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("resistor CAD component position", () => {
  const { project, staticAssetsServerUrl } = getTestFixture({
    withStaticAssetsServer: true,
  });

  project.add(
    <board width="10mm" height="10mm">
      <resistor
        resistance="1k"
        cadModel={{
          objUrl: `${staticAssetsServerUrl}/models/C2889342.obj`,
        }}
        footprint="0402"
        name="R1"
        pcbX={3}
      />
    </board>,
  );

  project.render();

  const cadComponent = project.db.cad_component.list()[0];

  expect(cadComponent).toBeDefined();
  expect(cadComponent.position.x).toBeCloseTo(3, 1);
  expect(cadComponent.position.y).toBeCloseTo(0, 1);
  expect(cadComponent.position.z).toBeCloseTo(0.7, 1);
});
