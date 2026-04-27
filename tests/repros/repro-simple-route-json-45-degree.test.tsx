import { test, expect } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/index"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("45 degree rects bug", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <chip
        name="45-degree-obs"
        pcbRotation={45}
        pinLabels={{ pin1: "OBSTACLE" }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              shape="rect"
              width={3.9}
              height={0.9}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.renderUntilSettled()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  expect(simpleRouteJson.obstacles.length).toBe(1)
  expect(simpleRouteJson.obstacles[0]?.ccwRotationDegrees).toBe(45)
  expect(simpleRouteJson.obstacles[0]?.height).toBe(0.9)
  expect(simpleRouteJson.obstacles[0]?.width).toBe(3.9)

  expect(simpleRouteJson).toMatchInlineSnapshot(`
    {
      "bounds": {
        "maxX": 3.95,
        "maxY": 2.45,
        "minX": -3.95,
        "minY": -2.45,
      },
      "connections": [],
      "layerCount": 2,
      "minTraceWidth": 0.1,
      "minViaDiameter": 0.3,
      "minViaHoleDiameter": 0.2,
      "minViaPadDiameter": 0.3,
      "min_via_hole_diameter": 0.2,
      "min_via_pad_diameter": 0.3,
      "nominalTraceWidth": undefined,
      "obstacles": [
        {
          "ccwRotationDegrees": 45,
          "center": {
            "x": 0,
            "y": 0,
          },
          "connectedTo": [
            "pcb_smtpad_0",
            "connectivity_net2",
            "source_port_0",
            "pcb_smtpad_0",
            "pcb_port_0",
          ],
          "height": 0.9,
          "layers": [
            "top",
          ],
          "type": "rect",
          "width": 3.9,
        },
      ],
      "outline": undefined,
    }
  `)
})
