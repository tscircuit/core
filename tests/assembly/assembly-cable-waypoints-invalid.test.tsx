import { expect, test } from "bun:test"
import { inferAssemblyCablePath } from "lib/components/primitive-components/infer-assembly-cable-path"

test("authored waypoints reject coincident points and reversing bends", () => {
  expect(() =>
    inferAssemblyCablePath({
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
  expect(() =>
    inferAssemblyCablePath({
      cableName: "HARNESS",
      from: { x: -20, y: 0, z: 10 },
      to: { x: 20, y: 0, z: 10 },
      fromDirection: { x: 0, y: 0, z: 1 },
      toDirection: { x: 0, y: 0, z: 1 },
      waypoints: [
        { x: 0, y: 20, z: 30 },
        { x: 0, y: 30, z: 30 },
        { x: 0, y: 20, z: 30 },
      ],
    }),
  ).toThrow('assembly.cable "HARNESS" waypoints must not reverse direction')
})
