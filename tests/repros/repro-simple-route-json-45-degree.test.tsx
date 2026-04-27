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

  // we should only be seeing one obstacle here, but we see 2
  expect(simpleRouteJson.obstacles.length).toBe(2)
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
            "x": 0.6894291116568839,
            "y": 0.6894291116568838,
          },
          "connectedTo": [
            "pcb_smtpad_0",
            "connectivity_net2",
            "source_port_0",
            "pcb_smtpad_0",
            "pcb_port_0",
          ],
          "height": 2.0152543263816605,
          "layers": [
            "top",
          ],
          "type": "rect",
          "width": 2.145,
        },
        {
          "ccwRotationDegrees": 45,
          "center": {
            "x": -0.6894291116568839,
            "y": -0.6894291116568838,
          },
          "connectedTo": [
            "pcb_smtpad_0",
            "connectivity_net2",
            "source_port_0",
            "pcb_smtpad_0",
            "pcb_port_0",
          ],
          "height": 2.0152543263816605,
          "layers": [
            "top",
          ],
          "type": "rect",
          "width": 2.145,
        },
      ],
      "outline": undefined,
    }
  `)
})
