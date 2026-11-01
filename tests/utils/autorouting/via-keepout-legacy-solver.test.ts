import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"

test("legacy pipelines cannot silently ignore via-only keepouts", () => {
  expect(
    () =>
      new TscircuitAutorouter(
        {
          layerCount: 2,
          minTraceWidth: 0.15,
          bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
          obstacles: [],
          connections: [],
          viaKeepouts: [
            {
              shape: "circle",
              center: { x: 0, y: 0 },
              radius: 1,
              layers: ["top"],
            },
          ],
        },
        { autorouterVersion: "beta_pipeline1" },
      ),
  ).toThrow("Via-only keepouts require")
})
