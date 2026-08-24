import { expect, test } from "bun:test"
import type {
  BusFanoutDirection,
  CanonicalBusFanoutDirection,
} from "@tscircuit/props"
import { getFanoutSolverBuses } from "lib/utils/autorouting/FanoutAutorouter"

const canonicalDirections: CanonicalBusFanoutDirection[] = [
  "topside_left",
  "topside_center",
  "topside_right",
  "rightside_top",
  "rightside_center",
  "rightside_bottom",
  "bottomside_right",
  "bottomside_center",
  "bottomside_left",
  "leftside_bottom",
  "leftside_center",
  "leftside_top",
  "center",
]

test("fanout solver buses preserve canonical exits, legacy guidance, and layer preferences", () => {
  const canonicalBuses = canonicalDirections.map((direction) => ({
    busId: direction,
    connectionNames: [`${direction}_connection`],
  }))
  const canonicalDirectionByBusId = Object.fromEntries(
    canonicalDirections.map((direction) => [direction, direction]),
  ) as Record<string, BusFanoutDirection>

  expect(
    getFanoutSolverBuses(canonicalBuses, canonicalDirectionByBusId)?.map(
      ({ busId, exitPosition }) => ({ busId, exitPosition }),
    ),
  ).toEqual(
    canonicalDirections.map((direction) => ({
      busId: direction,
      exitPosition: direction,
    })),
  )

  expect(
    getFanoutSolverBuses(
      [
        {
          busId: "LEGACY_DATA",
          connectionNames: ["D0"],
          preferredLayer: "inner2",
          preferredLayers: ["bottom", "inner2"],
        },
        {
          busId: "CANONICAL_CONTROL",
          connectionNames: ["CS"],
          allowedLayers: ["top", "inner1"],
          preferredLayer: "inner2",
          preferredLayers: ["inner1"],
        },
        {
          busId: "PLANE_DATA",
          connectionNames: ["GND0"],
          termination: { type: "plane", layer: "inner1" },
        },
      ],
      {
        LEGACY_DATA: "top_right",
        CANONICAL_CONTROL: { direction: "rightside_center" },
        PLANE_DATA: "rightside_top",
      },
    ),
  ).toEqual([
    {
      busId: "LEGACY_DATA",
      connectionNames: ["D0"],
      allowedLayers: ["inner2", "bottom"],
    },
    {
      busId: "CANONICAL_CONTROL",
      connectionNames: ["CS"],
      exitPosition: "rightside_center",
      allowedLayers: ["inner1"],
    },
    {
      busId: "PLANE_DATA",
      connectionNames: ["GND0"],
      termination: { type: "plane", layer: "inner1" },
    },
  ])
})
