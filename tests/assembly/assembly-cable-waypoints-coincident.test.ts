import { expect, test } from "bun:test"
import { resolveAssemblyCablePath } from "lib/components/primitive-components/resolve-assembly-cable-path"

test("coincident authored waypoints fail before producing an unrenderable cable", () => {
  expect(() =>
    resolveAssemblyCablePath({
      cableName: "HARNESS",
      from: { x: -20, y: 0, z: 10 },
      to: { x: 20, y: 0, z: 10 },
      fromDirection: { x: 0, y: 0, z: 1 },
      toDirection: { x: 0, y: 0, z: 1 },
      waypoints: [
        { x: 0, y: 20, z: 30 },
        { x: 0, y: 20, z: 30 },
      ],
    }),
  ).toThrow(
    'assembly.cable "HARNESS" waypoints must leave distinct consecutive path points',
  )
})
