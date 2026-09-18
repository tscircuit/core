import { expect, test } from "bun:test"
import { WindingBreakoutSolver } from "@tscircuit/winding-breakout-point-solver"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSvgFromGraphicsObject } from "graphics-debug"
import React from "react"
import { Circuit } from "../../lib"
import T113LinuxBoard from "../fixtures/t113-linux-exact/index.circuit"
import windingBreakoutInput from "../fixtures/t113-linux-exact/winding-breakout-input.json"

test("exact T113 routing groups follow their padded content bounds", async () => {
  const circuit = new Circuit({ platform: { useCloudAutorouter: false } })
  circuit.add(React.createElement(T113LinuxBoard))
  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const groups = circuitJson.filter((element) => element.type === "pcb_group")
  const getGroup = (name: string) => {
    const group = groups.find((candidate) => candidate.name === name)
    if (!group) throw new Error(`Missing exact T113 routing group ${name}`)
    return group
  }

  expect(
    circuitJson.filter((element) => element.type === "source_component"),
  ).toHaveLength(96)

  const buck = getGroup("BUCK")
  const supervisor33 = getGroup("SUP33")
  const regulator18 = getGroup("REG18")
  const usb = getGroup("USB")

  expect(buck.center.x).toBeCloseTo(29.353696, 6)
  expect(buck.center.y).toBeCloseTo(-17.3, 6)
  expect(supervisor33.center.x).toBeCloseTo(44.97723525, 6)
  expect(supervisor33.center.y).toBeCloseTo(11.11229925, 6)
  const regulator18AnchorPosition = regulator18.anchor_position
  if (!regulator18AnchorPosition) {
    throw new Error("Missing anchor position for exact T113 group REG18")
  }
  expect(regulator18.center).toEqual(regulator18AnchorPosition)
  expect(usb.center.x).toBeCloseTo(-17.2489698, 6)
  expect(usb.center.y).toBeCloseTo(-26.72952175, 6)

  const placementErrors = circuitJson.filter(
    (element) => element.type === "pcb_placement_error",
  )
  expect(placementErrors).toHaveLength(0)

  const windingAutoroutingErrors = circuitJson.filter(
    (element) =>
      element.type === "pcb_autorouting_error" &&
      element.message.includes("Winding fanout failed"),
  )
  expect(windingAutoroutingErrors).toHaveLength(0)

  const liveGroupById = new Map(
    groups.map((group) => [group.pcb_group_id, group]),
  )
  const windingSolver = new WindingBreakoutSolver({
    regions: windingBreakoutInput.regions.map((region) => {
      const group = liveGroupById.get(region.regionId)
      if (!group) throw new Error(`Missing live group ${region.regionId}`)
      const { width, height } = group
      if (width === undefined || height === undefined) {
        throw new Error(`Missing bounds size for live group ${region.regionId}`)
      }
      const edge = region.edge
      if (
        edge !== "left" &&
        edge !== "right" &&
        edge !== "top" &&
        edge !== "bottom"
      ) {
        throw new Error(`Invalid breakout edge ${edge}`)
      }
      return {
        id: region.regionId,
        bounds: {
          minX: group.center.x - width / 2,
          maxX: group.center.x + width / 2,
          minY: group.center.y - height / 2,
          maxY: group.center.y + height / 2,
        },
        edge,
      }
    }),
    connections: windingBreakoutInput.connections.map((connection) => ({
      id: connection.connectionId,
      endpoints: connection.endpoints,
    })),
    buses: [],
    boundaryPointSpacing: windingBreakoutInput.boundaryPointSpacing,
  })

  expect(() => windingSolver.solve()).not.toThrow()
  expect(windingSolver.solved).toBe(true)
  expect(windingSolver.getOutput().breakoutPoints).toHaveLength(4)

  await expect(
    convertCircuitJsonToPcbSvg(circuitJson, {
      showPcbGroups: true,
    }),
  ).toMatchSvgSnapshot(
    import.meta.path,
    "t113-linux-routing-group-bounds-pcb",
    {
      diffThresholdPercent: 0.02,
    },
  )
  expect(
    getSvgFromGraphicsObject(windingSolver.visualize(), {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path, "t113-linux-winding-fanout-bounds", {
    diffThresholdPercent: 0.02,
  })
}, 60_000)
