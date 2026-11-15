import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJson } from "@tscircuit/infgrid-ijump-astar"

const port = (id: string, sourceId: string, x: number) => ({
  type: "pcb_port" as const,
  pcb_port_id: id,
  source_port_id: sourceId,
  x,
  y: 2,
  layers: ["top"],
})
const trace = {
  type: "source_trace" as const,
  source_trace_id: "trace1",
  connected_source_port_ids: ["port1"],
}
const route = (elements: unknown[]) =>
  getSimpleRouteJson(elements as AnyCircuitElement[])

test("looks up pcb ports by source port id without mutating the input", () => {
  const elements = [port("wrong", "other", 9), port("pcb1", "port1", 1), trace]
  const before = structuredClone(elements)
  expect(route(elements).connections[0].pointsToConnect).toEqual([
    { x: 1, y: 2, layer: "top", pcb_port_id: "pcb1" },
  ])
  expect(elements).toEqual(before)
  expect(Object.keys(elements)).toEqual(["0", "1", "2"])
})

test("retains the missing pcb port error", () => {
  expect(() => route([port("wrong", "other", 9), trace])).toThrow(
    'Could not find pcb_port for source_port_id "port1"',
  )
})

test("retains first-match behavior for duplicate source port ids", () => {
  expect(
    route([port("first", "port1", 1), port("second", "port1", 9), trace])
      .connections[0].pointsToConnect[0].pcb_port_id,
  ).toBe("first")
})
