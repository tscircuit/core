import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSuboptimalChipOrientationsSrj } from "lib/utils/autorouting/get-suboptimal-chip-orientations-srj"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("chip orientation threshold and unsupported airwires are conservative", () => {
  const { circuit } = getTestFixture()
  const db = circuit.db
  const chip = db.source_component.insert({ ftype: "simple_chip", name: "U1" })
  const pcbChip = db.pcb_component.insert({
    source_component_id: chip.source_component_id,
    center: { x: 0, y: 0 },
    width: 2,
    height: 2,
    rotation: 180,
    layer: "top",
    obstructs_within_bounds: true,
  })
  const srj: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.15,
    bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
    obstacles: [],
    connections: [-1, 1].map((y, i) => {
      const sourcePort = db.source_port.insert({
        source_component_id: chip.source_component_id,
        name: `pin${i + 1}`,
        pin_number: i + 1,
      })
      const pad = db.pcb_port.insert({
        pcb_component_id: pcbChip.pcb_component_id,
        source_port_id: sourcePort.source_port_id,
        x: -1,
        y,
        layers: ["top", "bottom"],
      })
      const target = db.pcb_port.insert({
        pcb_component_id: "pcb_component_target",
        source_port_id: db.source_port.insert({
          source_component_id: chip.source_component_id,
          name: `target${i + 1}`,
        }).source_port_id,
        x: 5,
        y: -y,
        layers: ["top", "bottom"],
      })
      return {
        name: `D${i}`,
        pointsToConnect: [
          { x: pad.x, y: pad.y, pcb_port_id: pad.pcb_port_id, layer: "top" },
          {
            x: target.x,
            y: target.y,
            pcb_port_id: target.pcb_port_id,
            layer: "top",
          },
        ],
      }
    }),
  }
  const analyze = (
    input = srj,
    minimumCrossingsRemoved = 2,
    minimumFractionRemoved = 0.25,
  ) =>
    getSuboptimalChipOrientationsSrj({
      db,
      simpleRouteJson: input,
      threshold: { minimumCrossingsRemoved, minimumFractionRemoved },
    })[0]
  expect(analyze()).toMatchObject({
    currentCrossings: 1,
    bestCrossings: 0,
    shouldWarn: false,
  })
  expect(analyze(srj, 1, 1)).toMatchObject({ shouldWarn: true })
  // Two unavoidable crossings with another net make the relative threshold
  // independent of the absolute threshold: 3 -> 2 removes 33%, not 50%.
  const backgroundPorts = [-10, 10].map((y) =>
    db.pcb_port.insert({
      pcb_component_id: "pcb_component_background",
      source_port_id: db.source_port.insert({
        source_component_id: chip.source_component_id,
        name: `background${y}`,
      }).source_port_id,
      x: 3,
      y,
      layers: ["top"],
    }),
  )
  const withBackground: SimpleRouteJson = {
    ...srj,
    connections: [
      ...srj.connections,
      {
        name: "BACKGROUND",
        pointsToConnect: backgroundPorts.map((port) => ({
          x: port.x,
          y: port.y,
          layer: "top",
          pcb_port_id: port.pcb_port_id,
        })),
      },
    ],
  }
  const originalInput = JSON.stringify(withBackground)
  expect(analyze(withBackground, 1, 0.25)).toMatchObject({
    currentCrossings: 3,
    bestCrossings: 2,
    shouldWarn: true,
  })
  expect(analyze(withBackground, 1, 0.5)).toMatchObject({ shouldWarn: false })
  expect(JSON.stringify(withBackground)).toBe(originalInput)

  expect(
    analyze({
      ...srj,
      connections: srj.connections.map((c) => ({
        ...c,
        netConnectionName: "shared_net",
      })),
    }),
  ).toMatchObject({ currentCrossings: 0, shouldWarn: false })
  expect(
    analyze({
      ...srj,
      connections: srj.connections.map((c, i) => ({
        ...c,
        pointsToConnect: c.pointsToConnect.map((p) => ({
          ...p,
          layer: i === 0 ? "top" : "bottom",
        })),
      })),
    }),
  ).toMatchObject({ currentCrossings: 0, shouldWarn: false })
  expect(
    getSuboptimalChipOrientationsSrj({
      db,
      simpleRouteJson: {
        ...srj,
        connections: srj.connections.map((c) => ({
          ...c,
          pointsToConnect: [...c.pointsToConnect, c.pointsToConnect[0]],
        })),
      },
    }),
  ).toHaveLength(0)
  expect(
    getSuboptimalChipOrientationsSrj({
      db,
      simpleRouteJson: {
        ...srj,
        connections: srj.connections.map((c) => ({
          ...c,
          pointsToConnect: c.pointsToConnect.map((p) => ({
            ...p,
            x: p.x + 0.5,
          })),
        })),
      },
    }),
  ).toHaveLength(0)
  expect(() => analyze(srj, 0)).toThrow(
    "Invalid chip orientation warning threshold",
  )
})
