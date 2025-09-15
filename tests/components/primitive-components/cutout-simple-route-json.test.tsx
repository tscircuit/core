import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson";

// Reproduction: ensure cutouts are treated as obstacles in SimpleRouteJson
// and thus considered by the autorouter

test("cutout is treated as an obstacle in simple route json", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
      <cutout shape="rect" width="3mm" height="8mm" />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        schX={-3}
        pcbX={-3}
        pcbRotation={45}
      />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
    </board>,
  );

  await circuit.renderUntilSettled();

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  });

  // The cutout is centered at (0,0) with width 3mm and height 8mm
  const hasCutoutObstacle = simpleRouteJson.obstacles.some((o) => {
    return (
      Math.abs(o.center.x) < 1e-6 &&
      Math.abs(o.center.y) < 1e-6 &&
      Math.abs(o.width - 3) < 1e-6 &&
      Math.abs(o.height - 8) < 1e-6
    );
  });

  expect(hasCutoutObstacle).toBe(true);
});
