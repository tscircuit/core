import { expect, test } from "bun:test"
import { resolveAssemblyCablePath } from "lib/components/primitive-components/resolve-assembly-cable-path"

test("waypoints cannot coincide with the generated connector tangent point", () => {
  expect(() =>
    resolveAssemblyCablePath({
      cableName: "HARNESS",
      from: { x: 0, y: 0, z: 0 },
      to: { x: 20, y: 0, z: 0 },
      fromDirection: { x: 0, y: 0, z: 1 },
      toDirection: { x: 0, y: 0, z: 1 },
      waypoints: [{ x: 0, y: 0, z: 0.1 }],
    }),
  ).toThrow(
    'assembly.cable "HARNESS" waypoints must leave distinct consecutive path points',
  )
})
