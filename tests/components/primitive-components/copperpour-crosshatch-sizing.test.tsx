import { expect, test } from "bun:test"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom crosshatch distances reach the solver and size the emitted openings", async () => {
  const { circuit } = getTestFixture()
  let pourEvent: SolverStartedEvent | undefined
  circuit.on("solver:started", (event) => {
    if (event.solverName === "CopperPourPipelineSolver") pourEvent = event
  })
  circuit.add(
    <board width="14mm" height="9mm">
      <net name="GND" />
      <chip
        name="J1"
        footprint="pinrow2"
        connections={{ pin1: "net.GND", pin2: "net.GND" }}
      />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        crosshatch
        crosshatchPitch="2mm"
        crosshatchWidth="400um"
        useThermalReliefs
      />
      <copperpour
        connectsTo="net.GND"
        layer="bottom"
        crosshatch={false}
        crosshatchPitch="2mm"
        crosshatchWidth="0.4mm"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-3.4}
        fontSize={0.4}
        text="2mm PITCH / 0.4mm COPPER + THERMALS"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(pourEvent?.solverParams.regionsForPour).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        crosshatch: true,
        crosshatchPitch: 2,
        crosshatchWidth: 0.4,
      }),
      expect.objectContaining({
        crosshatch: false,
        crosshatchPitch: 2,
        crosshatchWidth: 0.4,
      }),
    ]),
  )
  const top = circuit.db.pcb_copper_pour
    .list()
    .find((pour) => pour.layer === "top")!
  const bottom = circuit.db.pcb_copper_pour
    .list()
    .find((pour) => pour.layer === "bottom")!
  if (top.shape !== "brep" || bottom.shape !== "brep")
    throw new Error("Expected BRep pours")
  const openingAreas = top.brep_shape.inner_rings.map(
    ({ vertices }) =>
      Math.abs(
        vertices.reduce((area, p, i) => {
          const next = vertices[(i + 1) % vertices.length]!
          return area + p.x * next.y - next.x * p.y
        }, 0),
      ) / 2,
  )
  expect(
    openingAreas.filter((area) => Math.abs(area - 1.6 ** 2) < 1e-5).length,
  ).toBeGreaterThan(0)
  expect(
    top.brep_shape.inner_rings.some((ring) =>
      ring.vertices.some(
        ({ x, y }) =>
          Math.abs(Math.abs(x) - (7 - 0.2 - 0.4)) < 1e-6 ||
          Math.abs(Math.abs(y) - (4.5 - 0.2 - 0.4)) < 1e-6,
      ),
    ),
  ).toBe(true)
  expect(bottom.brep_shape.inner_rings).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
