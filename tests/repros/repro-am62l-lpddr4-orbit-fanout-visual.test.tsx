import { expect, test } from "bun:test"
import { checkEachPcbTraceNonOverlapping } from "@tscircuit/checks"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { SolverStartedEvent } from "lib/events"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"

type SolverBus = {
  busId: string
  exitPosition?: string
}

const placements = [
  {
    label: "RAM EAST: AM62L RIGHT / RAM LEFT",
    dramPosition: { x: 30, y: 0 },
    expectedSocExits: ["rightside_top", "rightside_bottom"],
    expectedDramExits: ["leftside_center", "leftside_center"],
  },
  {
    label: "RAM NORTH: AM62L TOP / RAM BOTTOM",
    dramPosition: { x: 0, y: 30 },
    expectedSocExits: ["topside_left", "topside_right"],
    expectedDramExits: ["bottomside_center", "bottomside_center"],
  },
  {
    label: "RAM WEST: AM62L LEFT / RAM RIGHT",
    dramPosition: { x: -30, y: 0 },
    expectedSocExits: ["leftside_bottom", "leftside_top"],
    expectedDramExits: ["rightside_center", "rightside_center"],
  },
  {
    label: "RAM SOUTH: AM62L BOTTOM / RAM TOP",
    dramPosition: { x: 0, y: -30 },
    expectedSocExits: ["bottomside_right", "bottomside_left"],
    expectedDramExits: ["topside_center", "topside_center"],
  },
] as const

const getDdrExitPositions = (event: SolverStartedEvent) =>
  ((event.solverConstructorArgs?.[1] as { buses?: SolverBus[] })?.buses ?? [])
    .filter((bus) => bus.busId === "DDR_BYTE0" || bus.busId === "DDR_BYTE1")
    .map((bus) => bus.exitPosition)

const createPanelLabelSvg = (label: string) => `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="1000"
  height="48"
  viewBox="0 0 1000 48"
>
  <rect width="1000" height="48" fill="#111827" />
  <text
    x="500"
    y="25"
    fill="#f8fafc"
    font-family="Arial, sans-serif"
    font-size="20"
    font-weight="700"
    text-anchor="middle"
    dominant-baseline="middle"
  >${label}</text>
</svg>`

test("actual AM62L and LPDDR4 fanout routes follow all four orbit quadrants", async () => {
  const panelSvgs: string[] = []

  for (const placement of placements) {
    const solverStartedEvents: SolverStartedEvent[] = []
    const circuit = await renderAm62lLpddr4Fanout({
      includePowerPlaneFanout: false,
      layout: {
        boardWidth: "80mm",
        boardHeight: "80mm",
        socPcbX: 0,
        socPcbY: 0,
        socFanoutPadding: "5mm",
        dramPcbX: placement.dramPosition.x,
        dramPcbY: placement.dramPosition.y,
        dramFanoutPadding: "5mm",
      },
      maxSignalConnectionsPerBus: 3,
      onSolverStarted: (event) => solverStartedEvents.push(event),
      orientBusFanoutDirectionsTowardOtherComponent: true,
      skipDetailedValidation: true,
      snapshotPath: import.meta.path,
    })

    const fanoutSolverEvents = solverStartedEvents.filter(
      (event) => event.solverName === "FanoutSolver",
    )
    expect(fanoutSolverEvents).toHaveLength(2)
    expect(getDdrExitPositions(fanoutSolverEvents[0]!)).toEqual([
      ...placement.expectedSocExits,
    ])
    expect(getDdrExitPositions(fanoutSolverEvents[1]!)).toEqual([
      ...placement.expectedDramExits,
    ])
    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(circuit.db.pcb_trace_error.list()).toEqual([])
    expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
    expect(checkEachPcbTraceNonOverlapping(circuit.getCircuitJson())).toEqual(
      [],
    )

    panelSvgs.push(
      stackSvgsVertically(
        [
          createPanelLabelSvg(placement.label),
          convertCircuitJsonToPcbSvg(circuit.getCircuitJson(), {
            showPcbGroups: true,
          }),
        ],
        { gap: 0, normalizeSize: false },
      ),
    )
  }

  const comparisonSvg = stackSvgsVertically(
    [
      stackSvgsHorizontally(panelSvgs.slice(0, 2), {
        gap: 16,
        normalizeSize: false,
      }),
      stackSvgsHorizontally(panelSvgs.slice(2), {
        gap: 16,
        normalizeSize: false,
      }),
    ],
    {
      gap: 16,
      normalizeSize: false,
      rootAttributes: {
        "data-testid": "am62l-lpddr4-orbit-aware-fanout",
      },
    },
  )

  expect(comparisonSvg).toMatchSvgSnapshot(
    import.meta.path,
    "am62l-lpddr4-orbit-aware-fanout",
  )
}, 60_000)
