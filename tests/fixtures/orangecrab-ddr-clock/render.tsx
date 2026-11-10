import type { PcbSvgOptions } from "circuit-to-svg"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { OrangeCrabDdrClockBoard } from "./board"

export const orangeCrabClockSnapshotOptions: PcbSvgOptions = {
  backgroundColor: "white",
  width: 1400,
  height: 1000,
  viewport: { minX: -7, minY: -8.5, maxX: 23, maxY: 10.5 },
  shouldDrawErrors: false,
  shouldDrawRatsNest: false,
  showPcbGroups: false,
  showDebugObjects: false,
}

export async function renderOrangeCrabDdrClock(routeTerminations = false) {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  const outputs: SimpleRouteJson[] = []
  const asyncErrors: string[] = []
  const solverNames: Array<string | undefined> = []
  const phaseNames: Array<string | undefined> = []
  circuit.on("autorouting:start", (event) => {
    phaseNames.push(event.phaseName)
    solverNames.push(event.solverName)
    inputs.push(event.simpleRouteJson)
  })
  circuit.on("autorouting:end", (event) => outputs.push(event.simpleRouteJson))
  circuit.on("asyncEffect:end", (event) => {
    if (event.error) asyncErrors.push(String(event.error))
  })
  circuit.add(<OrangeCrabDdrClockBoard routeTerminations={routeTerminations} />)
  await circuit.renderUntilSettled()
  return { circuit, inputs, outputs, phaseNames, asyncErrors, solverNames }
}
