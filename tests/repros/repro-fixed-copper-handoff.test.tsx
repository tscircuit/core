import { expect, test } from "bun:test"
import {
  checkSourceTracesHavePcbTraces,
  checkEachPcbPortConnectedToPcbTraces,
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
  checkViaTraceClearance,
  checkViaPadClearance,
  checkDifferentNetViaSpacing,
  checkTracesAreContiguous,
  checkViasInPads,
  checkHoleTraceClearance,
  checkSourceTracesMatchPcbTraceThickness,
} from "@tscircuit/checks"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import type { AnyCircuitElement } from "circuit-json"
import { RootCircuit } from "lib/RootCircuit"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { ManualFixedBoard } from "tests/fixtures/fixed-copper-handoff/board"
import { getFixedCopperHandoffSnapshot } from "tests/fixtures/fixed-copper-handoff/snapshot"

test("later native routing loses structured manual copper at the Core boundary", async () => {
  const circuit = new RootCircuit()
  let before: AnyCircuitElement[] | undefined
  let input: SimpleRouteJson | undefined
  circuit.on("autorouting:start", () => {
    before = structuredClone(circuit.getCircuitJson())
  })
  circuit.on("solver:started", (event) => {
    if (event.solverName === "AutoroutingPipelineSolver9_PreloadedTraceGraph") {
      input = structuredClone(event.solverParams.input)
      expect(event.solverConstructorArgs).toEqual([event.solverParams])
    }
  })
  circuit.add(<ManualFixedBoard />)
  await circuit.renderUntilSettled()
  expect(before).toBeDefined()
  expect(input).toBeDefined()
  if (!before || !input) throw new Error("Native constructor was not observed")
  const final = circuit.getCircuitJson()
  const initialCopper = before.filter(
    (element) => element.type === "pcb_trace" || element.type === "pcb_via",
  )
  expect(initialCopper.filter((element) => element.type === "pcb_trace")).toHaveLength(1)
  expect(initialCopper.filter((element) => element.type === "pcb_via")).toHaveLength(1)
  expect(final).toEqual(expect.arrayContaining(initialCopper))
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  const options = { connMap: getFullConnectivityMapFromCircuitJson(final) }
  const findings = {
    missing_traces: checkSourceTracesHavePcbTraces(final),
    disconnected_ports: checkEachPcbPortConnectedToPcbTraces(final),
    trace_overlap: checkEachPcbTraceNonOverlapping(final, options),
    pad_trace: checkPadTraceClearance(final, options),
    via_trace: checkViaTraceClearance(final, options),
    via_pad: checkViaPadClearance(final, options),
    via_spacing: checkDifferentNetViaSpacing(final),
    contiguous: checkTracesAreContiguous(final),
    via_in_pad: checkViasInPads(final),
    hole_trace: checkHoleTraceClearance(final),
    width: checkSourceTracesMatchPcbTraceThickness(final),
  }
  expect(Object.fromEntries(Object.entries(findings).map(([name, errors]) => [name, errors.length]))).toEqual({
    missing_traces: 0, disconnected_ports: 0, trace_overlap: 0, pad_trace: 0,
    via_trace: 0, via_pad: 0, via_spacing: 0, contiguous: 0, via_in_pad: 0,
    hole_trace: 0, width: 0,
  })
  const physical = getSimpleRouteJsonFromCircuitJson({ circuitJson: before }).simpleRouteJson
  expect(physical.traces).toHaveLength(1)
  // Known defect: the native immutable-preload API receives only proxies.
  expect(input.traces).toEqual([])
  expect(input.obstacles).toHaveLength(12)
  await expect(getFixedCopperHandoffSnapshot([
    { title: "Existing manufactured copper", description: "A to B: fixed path and physical via; C to D: later net.", input: physical },
    { title: "Actual native solver input", description: "Defect: one structured path became eight proxy obstacles.", input },
    { title: "Final board: 2 connected nets, 11 DRC checks clean", description: "Original path and via remain byte-for-byte unchanged.", input: getSimpleRouteJsonFromCircuitJson({ circuitJson: final }).simpleRouteJson },
  ])).toMatchSvgSnapshot(import.meta.path)
}, 20_000)
