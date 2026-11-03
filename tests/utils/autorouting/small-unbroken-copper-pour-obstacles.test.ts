import { expect, test } from "bun:test"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { getUnbrokenCopperPourObstacles } from "lib/utils/autorouting/getUnbrokenCopperPourObstacles"

test("unbroken copper smaller than a scanline retains its own routing bounds", (): void => {
  const copperObstacles = getUnbrokenCopperPourObstacles({
    connMap: new ConnectivityMap({ VDDIO: ["source_net_vddio"] }),
    board: {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 10,
      height: 8,
      num_layers: 2,
      thickness: 1.6,
      material: "fr4",
    },
    subcircuitComponent: {
      selectAll: () => [{
        _parsedProps: {
          layer: "top",
          connectsTo: "net.VDDIO",
          unbroken: true,
          outline: [
            { x: 1, y: 1 },
            { x: 1.15, y: 1 },
            { x: 1.15, y: 1.25 },
            { x: 1, y: 1.25 },
          ],
        },
        getSubcircuit: () => ({
          selectOne: () => ({ source_net_id: "source_net_vddio" }),
        }),
      }],
    },
  })
  expect(copperObstacles).toHaveLength(1)
  expect(copperObstacles[0]!.width).toBeCloseTo(0.15, 8)
  expect(copperObstacles[0]!.height).toBeCloseTo(0.25, 8)
  expect(copperObstacles[0]!.center.x).toBeCloseTo(1.075, 8)
  expect(copperObstacles[0]!.center.y).toBeCloseTo(1.125, 8)
  expect(copperObstacles[0]!.connectedTo).toContain("source_net_vddio")
})
