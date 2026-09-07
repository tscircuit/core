import { expect, test } from "bun:test"
import type { CopperPourProps } from "@tscircuit/props"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("copperpour preserves effective solver rules on every fill fragment", async () => {
  const cases: Array<{
    props: Partial<CopperPourProps>
    expected: Record<string, number | boolean>
  }> = [
    {
      props: { clearance: "0.3mm" },
      expected: {
        clearance: 0.3,
        pad_margin: 0.3,
        trace_margin: 0.3,
        board_edge_margin: 0.3,
        cutout_margin: 0.3,
        use_thermal_reliefs: false,
      },
    },
    {
      props: {},
      expected: {
        clearance: 0.2,
        pad_margin: 0.2,
        trace_margin: 0.2,
        board_edge_margin: 0.2,
        cutout_margin: 0.2,
        use_thermal_reliefs: false,
      },
    },
    {
      props: {
        clearance: "0.3mm",
        padMargin: "0.45mm",
        traceMargin: "0.4mm",
        boardEdgeMargin: "0.5mm",
        cutoutMargin: "0.6mm",
        useThermalReliefs: true,
      },
      expected: {
        clearance: 0.3,
        pad_margin: 0.45,
        trace_margin: 0.4,
        board_edge_margin: 0.5,
        cutout_margin: 0.6,
        use_thermal_reliefs: true,
        thermal_relief_spoke_width: 0.3,
      },
    },
    {
      props: {
        clearance: 0,
        padMargin: 0,
        traceMargin: 0,
        boardEdgeMargin: 0,
        cutoutMargin: 0,
      },
      expected: {
        clearance: 0,
        pad_margin: 0,
        trace_margin: 0,
        board_edge_margin: 0,
        cutout_margin: 0,
        use_thermal_reliefs: false,
      },
    },
  ]

  for (const { props, expected } of cases) {
    const { circuit } = getTestFixture()
    let copperPourEvent: SolverStartedEvent | undefined
    circuit.on("solver:started", (event) => {
      if (event.solverName === "CopperPourPipelineSolver") {
        copperPourEvent = event
      }
    })
    circuit.add(
      <board width="10mm" height="8mm" routingDisabled>
        <net name="GND" />
        <copperpour connectsTo="net.GND" layer="top" {...props} />
      </board>,
    )
    await circuit.renderUntilSettled()

    const solverRegion = copperPourEvent?.solverParams.regionsForPour[0]
    expect(solverRegion).toBeDefined()
    const pours = circuit.db.pcb_copper_pour.list()
    expect(pours.length).toBeGreaterThan(0)
    for (const pour of pours) {
      expect(pour).toMatchObject(expected)
      expect(pour).toMatchObject({
        clearance: solverRegion.pourMargin,
        pad_margin: solverRegion.padMargin,
        trace_margin: solverRegion.traceMargin,
        board_edge_margin: solverRegion.board_edge_margin,
        cutout_margin: solverRegion.cutout_margin,
        use_thermal_reliefs: solverRegion.use_thermal_reliefs ?? false,
        thermal_relief_spoke_width: solverRegion.thermal_relief_spoke_width,
      })
    }
  }
})
