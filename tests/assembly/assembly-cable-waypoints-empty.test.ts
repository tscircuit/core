import { expect, test } from "bun:test"
import { inferAssemblyCablePath } from "lib/components/primitive-components/infer-assembly-cable-path"
import { resolveAssemblyCablePath } from "lib/components/primitive-components/resolve-assembly-cable-path"

test("an empty waypoint list preserves the automatic route exactly", () => {
  const endpoints = {
    from: { x: -20, y: 0, z: 10 },
    to: { x: 20, y: 0, z: 10 },
    fromDirection: { x: 0, y: 0, z: 1 },
    toDirection: { x: 0, y: 0, z: 1 },
  }
  expect(
    resolveAssemblyCablePath({
      ...endpoints,
      cableName: "HARNESS",
      waypoints: [],
    }),
  ).toEqual(inferAssemblyCablePath(endpoints))
})
