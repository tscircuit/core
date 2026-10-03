import { expect, test } from "bun:test"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("crosshatch reaches the solver and emits mesh holes with connected thermal pads", async () => {
  const { circuit } = getTestFixture()
  let copperPourEvent: SolverStartedEvent | undefined
  circuit.on("solver:started", (event) => {
    if (event.solverName === "CopperPourPipelineSolver") copperPourEvent = event
  })
  circuit.add(
    <board width="14mm" height="9mm">
      <net name="GND" />
      <chip
        name="J1"
        footprint="pinrow4"
        connections={{
          pin1: "net.GND",
          pin2: "net.GND",
          pin3: "net.GND",
          pin4: "net.GND",
        }}
      />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        crosshatch
        useThermalReliefs
        padMargin="0.45mm"
      />
      <copperpour connectsTo="net.GND" layer="bottom" crosshatch={false} />
      <pcbnotetext
        pcbX={0}
        pcbY={-3.4}
        fontSize={0.4}
        text="CROSSHATCH + THERMAL RELIEFS"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    copperPourEvent?.solverParams.regionsForPour.map(
      (region: { crosshatch?: boolean }) => region.crosshatch,
    ),
  ).toEqual([true, false])
  const topPours = circuit.db.pcb_copper_pour
    .list()
    .filter((pour) => pour.layer === "top")
  const bottomPours = circuit.db.pcb_copper_pour
    .list()
    .filter((pour) => pour.layer === "bottom")
  expect(topPours).toHaveLength(1)
  expect(bottomPours).toHaveLength(1)
  const top = topPours[0]!
  const bottom = bottomPours[0]!
  if (top.shape !== "brep" || bottom.shape !== "brep")
    throw new Error("Expected BRep copper pours")
  expect(top.brep_shape.inner_rings.length).toBeGreaterThan(30)
  // Partial edge cells reach the 0.25mm rim inside the 0.2mm board clearance.
  // The old whole-cell-only solver leaves a wider solid band here.
  expect(
    top.brep_shape.inner_rings.some((ring) =>
      ring.vertices.some(
        ({ x, y }) =>
          Math.abs(Math.abs(x) - (7 - 0.2 - 0.25)) < 1e-6 ||
          Math.abs(Math.abs(y) - (4.5 - 0.2 - 0.25)) < 1e-6,
      ),
    ),
  ).toBe(true)
  expect(bottom.brep_shape.inner_rings).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
