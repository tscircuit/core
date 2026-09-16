import { expect, test } from "bun:test"
import {
  copperPolygonsTouch,
  getPlatedHolePolygon,
  getPourPolygon,
} from "lib/utils/copper-pour-connectivity/copper-geometry"
import { Fragment } from "react"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro3901: plated contacts joined by a bottom pour get false disconnections", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={10}
      height={10}
      layers={2}
      // Keep routing checks enabled, but generate no conventional GND tracks.
      autorouter={{ algorithmFn: createBasicAutorouter(async () => []) }}
    >
      <net name="GND" />
      {(["J1", "J2"] as const).map((name) => (
        <Fragment key={name}>
          <chip
            name={name}
            pcbX={name === "J1" ? -2 : 2}
            pinLabels={{ pin1: "GND" }}
            footprint={
              <footprint>
                <platedhole
                  portHints={["1"]}
                  holeDiameter={0.8}
                  outerDiameter={1.4}
                  shape="circle"
                />
                <courtyardcircle radius={1} />
              </footprint>
            }
          />
          <trace from={`${name}.pin1`} to="net.GND" />
          <pcbnotetext
            text={`${name}.GND`}
            pcbX={name === "J1" ? -2 : 2}
            pcbY={1.3}
            fontSize={0.35}
          />
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
      <pcbnotetext
        text="GND: bottom pour, no tracks"
        pcbY={3.5}
        fontSize={0.4}
      />
      <pcbnotetext text="Both pads touch one fill" pcbY={-2.5} fontSize={0.4} />
      <pcbnotetext
        text="BUG #3901: both reported disconnected"
        pcbY={-3.3}
        fontSize={0.35}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

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

  // Compare emitted copper in board-world mm (+X right, +Y up), accounting
  // for the pour's inner rings and each plated pad's drill hole.
  const pourPolygon = getPourPolygon(pours[0]!)
  for (const platedHole of platedHoles) {
    expect(platedHole.layers).toEqual(expect.arrayContaining(["top", "bottom"]))
    expect(
      copperPolygonsTouch(pourPolygon, getPlatedHolePolygon(platedHole)),
    ).toBe(true)
  }

  // Current buggy baseline from https://github.com/tscircuit/core/issues/3901.
  // A fix should change this to [] while preserving the geometry assertions.
  // The issue's separate via-courtyard diagnostic is outside this test's scope.
  expect(
    circuit.db.pcb_port_not_connected_error
      .list()
      .map((error) => error.message)
      .sort(),
  ).toEqual([
    "Port [J1.GND] is not connected to net [GND] by a PCB trace.",
    "Port [J2.GND] is not connected to net [GND] by a PCB trace.",
  ])

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
  })
})
