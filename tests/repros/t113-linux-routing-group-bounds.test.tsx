import { expect, test } from "bun:test"
import { WindingBreakoutSolver } from "@tscircuit/winding-breakout-point-solver"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSvgFromGraphicsObject } from "graphics-debug"
import React from "react"
import { Circuit } from "../../lib"
import T113LinuxBoard from "../fixtures/t113-linux-exact/index.circuit"
import windingBreakoutInput from "../fixtures/t113-linux-exact/winding-breakout-input.json"

test("exact T113 routing groups expose their misplaced bounds", async () => {
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

  const expectCenteredOnAnchor = (group: ReturnType<typeof getGroup>) => {
    const anchorPosition = group.anchor_position
    if (!anchorPosition) {
      throw new Error(
        `Missing anchor position for exact T113 group ${group.name}`,
      )
    }
    expect(group.center).toEqual(anchorPosition)
  }

  expectCenteredOnAnchor(buck)
  expectCenteredOnAnchor(supervisor33)
  expectCenteredOnAnchor(regulator18)
  expectCenteredOnAnchor(usb)

  const placementErrors = circuitJson.filter(
    (element) => element.type === "pcb_placement_error",
  )
  expect(placementErrors).toHaveLength(1)
  expect(placementErrors[0]?.message).toContain(
    'Fanout boundaries "REG18" and "USB" overlap',
  )

  const windingAutoroutingErrors = circuitJson.filter(
    (element) =>
      element.type === "pcb_autorouting_error" &&
      element.message.includes("Winding fanout failed"),
  )
  expect(windingAutoroutingErrors).toHaveLength(2)

  const liveGroupById = new Map(
    groups.map((group) => [group.pcb_group_id, group]),
  )
  const windingSolver = new WindingBreakoutSolver({
    regions: windingBreakoutInput.regions.map((region) => {
      const group = liveGroupById.get(region.regionId)
      if (!group) throw new Error(`Missing live group ${region.regionId}`)
      return {
        id: region.regionId,
        bounds: {
          minX: group.center.x - group.width / 2,
          maxX: group.center.x + group.width / 2,
          minY: group.center.y - group.height / 2,
          maxY: group.center.y + group.height / 2,
        },
        edge: region.edge,
      }
    }),
    connections: windingBreakoutInput.connections.map((connection) => ({
      id: connection.connectionId,
      endpoints: connection.endpoints,
    })),
    buses: [],
    boundaryPointSpacing: windingBreakoutInput.boundaryPointSpacing,
  })

  expect(() => windingSolver.solve()).toThrow(
    "declared breakout edges need 0.85mm but expose only -0.60mm",
  )
  expect(windingSolver.solved).toBe(false)

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
