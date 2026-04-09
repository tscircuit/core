import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"

test("simple route json includes the generated copper pour connection", async () => {
  const { circuit } = getTestFixture()

  let capturedConnections: unknown

  circuit.add(
    <board
      width="20mm"
      height="12mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        algorithmFn: async (simpleRouteJson) => {
          capturedConnections = simpleRouteJson.connections
          return new TscircuitAutorouter(simpleRouteJson)
        },
      }}
    >
      <net name="GND" />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0805"
        pcbX={-4}
        connections={{ pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0805"
        pcbX={4}
        connections={{ pin1: "net.GND" }}
      />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(capturedConnections).toMatchInlineSnapshot(`
    [
      {
        "name": "source_net_0",
        "pointsToConnect": [
          {
            "layer": "top",
            "pcb_port_id": "pcb_port_1",
            "pointId": "pcb_port_1",
            "x": -3.0875,
            "y": 0,
          },
          {
            "layer": "top",
            "pcb_port_id": "pcb_port_2",
            "pointId": "pcb_port_2",
            "x": 3.0875,
            "y": 0,
          },
        ],
      },
    ]
  `)
})
