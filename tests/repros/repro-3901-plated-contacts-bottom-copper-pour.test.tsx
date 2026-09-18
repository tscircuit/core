import { expect, test } from "bun:test"
import { Fragment } from "react"
import type { AutorouterCompleteEvent } from "lib/utils/autorouting/GenericLocalAutorouter"
import {
  copperPolygonsTouch,
  getPlatedHolePolygon,
  getPourPolygon,
} from "lib/utils/copper-pour-connectivity/copper-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro3901: plated contacts on a bottom pour get false disconnected-port errors", async () => {
  const { circuit } = getTestFixture()

  // Match https://github.com/tscircuit/core/issues/3901: do not add a GND
  // trace tree before the pour, and leave the routing DRC enabled.
  const explicitOnly = async () => {
    const handlers = new Map<string, (event: AutorouterCompleteEvent) => void>()
    return {
      on(event: string, handler: (event: AutorouterCompleteEvent) => void) {
        handlers.set(event, handler)
      },
      start() {
        handlers.get("complete")!({ type: "complete", traces: [] })
      },
      stop() {},
    }
  }

  circuit.add(
    <board
      width={10}
      height={10}
      layers={2}
      autorouter={{ algorithmFn: explicitOnly }}
    >
      <net name="GND" />
      {(
        [
          ["J1", -2],
          ["J2", 2],
        ] as const
      ).map(([name, x]) => (
        <Fragment key={name}>
          <chip
            name={name}
            pcbX={x}
            pcbY={0}
            pinLabels={{ pin1: "GND" }}
            footprint={
              <footprint>
                <platedhole
                  portHints={["1"]}
                  holeDiameter={0.8}
                  outerDiameter={1.4}
                  shape="circle"
                  pcbX={0}
                  pcbY={0}
                />
                <courtyardcircle radius={1} pcbX={0} pcbY={0} />
              </footprint>
            }
          />
          <trace from={`${name}.pin1`} to="net.GND" />
        </Fragment>
      ))}
      <via
        name="VGND"
        pcbX={0}
        pcbY={0}
        holeDiameter={0.3}
        outerDiameter={0.6}
        connectsTo="net.GND"
      />
      <copperpour
        layer="bottom"
        connectsTo="net.GND"
        clearance={0.16}
        boardEdgeMargin={0.31}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const groundNet = circuit.db.source_net
    .list()
    .find((net) => net.name === "GND")!
  const pours = circuit.db.pcb_copper_pour.list()
  const platedHoles = circuit.db.pcb_plated_hole.list()

  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(pours).toHaveLength(1)
  expect(pours[0]).toMatchObject({
    shape: "brep",
    layer: "bottom",
    source_net_id: groundNet.source_net_id,
  })
  expect(platedHoles).toHaveLength(2)

  // Compare emitted copper in board-world mm (+X right, +Y up), including
  // BRep cutouts and the drilled holes, rather than just pad-center bounds.
  const pourPolygon = getPourPolygon(pours[0]!)
  for (const platedHole of platedHoles) {
    expect(platedHole.layers).toEqual(expect.arrayContaining(["top", "bottom"]))
    expect(
      copperPolygonsTouch(pourPolygon, getPlatedHolePolygon(platedHole)),
    ).toBe(true)
  }

  // Baseline only: after the connectivity fix, expect [] here and update the
  // snapshot while keeping the circuit and physical-contact assertions intact.
  // The separate via-courtyard diagnostic is outside issue #3901's scope.
  expect(
    circuit.db.pcb_port_not_connected_error
      .list()
      .map((error) => error.message)
      .sort(),
  ).toEqual([
    "Port [J1.GND] is not connected to net [GND] by a PCB trace.",
    "Port [J2.GND] is not connected to net [GND] by a PCB trace.",
  ])

  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
  })
})
