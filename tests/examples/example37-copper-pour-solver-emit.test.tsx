import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const BOARD_SIZE = "10mm"

test("copper pour creates net from connectsTo prop", async () => {
  const { circuit } = getTestFixture()

  let copperPourEvent: string
  circuit.on("solver:started", (data) => {
    copperPourEvent = JSON.stringify(data, null, 2)
  })

  circuit.add(
    <board width={BOARD_SIZE} height={BOARD_SIZE}>
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(copperPourEvent!).toMatchInlineSnapshot(`
    "{
      "solverName": "CopperPourPipelineSolver",
      "solverParams": {
        "pads": [],
        "regionsForPour": [
          {
            "shape": "rect",
            "layer": "top",
            "bounds": {
              "minX": -5,
              "minY": -5,
              "maxX": 5,
              "maxY": 5
            },
            "connectivityKey": "unnamedsubcircuit1_connectivity_net0",
            "padMargin": 0.2,
            "traceMargin": 0.2,
            "board_edge_margin": 0.2,
            "cutout_margin": 0.2
          }
        ]
      }
    }"
  `)
})
