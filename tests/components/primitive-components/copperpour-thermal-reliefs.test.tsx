import { expect, test } from "bun:test"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("copperpour creates thermal relief spokes around same-net plated holes", async () => {
  const { circuit } = getTestFixture()
  let copperPourEvent: SolverStartedEvent | undefined

  circuit.on("solver:started", (event) => {
    if (event.solverName === "CopperPourPipelineSolver") {
      copperPourEvent = event
    }
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
        padMargin="0.45mm"
        useThermalReliefs
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-3.4}
        fontSize={0.45}
        text="4 THERMAL RELIEF SPOKES · 0.3MM"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(copperPourEvent?.solverParams.regionsForPour[0]).toMatchObject({
    use_thermal_reliefs: true,
    thermal_relief_spoke_width: 0.3,
  })
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(4)
  expect(circuit.db.pcb_copper_pour.list().length).toBeGreaterThan(0)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
