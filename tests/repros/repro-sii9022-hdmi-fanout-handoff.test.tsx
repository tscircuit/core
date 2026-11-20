import { expect, test } from "bun:test"
import { pcb_trace } from "circuit-json"
import { renderSii9022HdmiFanoutHandoff } from "tests/fixtures/create-sii9022-hdmi-fanout-handoff"

test("SII9022 HDMI fanout handoff routes all TMDS connections", async () => {
  const { circuit, autoroutingPhaseIoStack } =
    await renderSii9022HdmiFanoutHandoff()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(24)
  expect(autoroutingPhaseIoStack).toHaveLength(2)
  expect(autoroutingPhaseIoStack[0]?.endSimpleRouteJson?.traces).toHaveLength(8)
  expect(
    autoroutingPhaseIoStack[1]?.startSimpleRouteJson?.buses?.map(
      (bus) => bus.connectionNames.length,
    ),
  ).toEqual([2, 2, 2, 2])
  expect(autoroutingPhaseIoStack[1]?.endSimpleRouteJson?.traces).toHaveLength(
    16,
  )
  const fixedCopperConnectionNames = new Set(
    autoroutingPhaseIoStack[1]!.startSimpleRouteJson!.obstacles.flatMap(
      (obstacle) => obstacle.connectedTo,
    ),
  )
  for (const fanoutTrace of autoroutingPhaseIoStack[0]!.endSimpleRouteJson!
    .traces!) {
    expect(fixedCopperConnectionNames.has(fanoutTrace.connection_name!)).toBe(
      true,
    )
    const finalTrace = circuit.db.pcb_trace.get(fanoutTrace.pcb_trace_id)
    expect(pcb_trace.parse(finalTrace).route).toEqual(
      pcb_trace.parse(fanoutTrace).route,
    )
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 300_000)
