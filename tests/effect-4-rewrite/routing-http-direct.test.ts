import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { createRoutingJob, routingInput } from "./routing-fixture"
import {
  createHttpRoutingFixture,
  provideRoutingServices,
} from "./routing-http-fixture"

test("Effect HTTP solve preserves request fields, headers and routing output", async () => {
  const { circuit, board } = createHttpRoutingFixture()
  const output = { output_simple_route_json: { ...routingInput, traces: [] } }
  const requests: Array<{ url: string; options?: RequestInit }> = []
  const job = createRoutingJob()
  await Effect.runPromise(
    provideRoutingServices(board._runHttpAutoroutingEffect(job), {
      job,
      fetch: async (url, options) => {
        requests.push({ url, options })
        return Response.json({ autorouting_result: output })
      },
    }),
  )
  expect(requests).toHaveLength(1)
  expect(requests[0].url).toBe("https://routing.test/autorouting/solve")
  expect(JSON.parse(String(requests[0].options?.body))).toEqual({
    input_circuit_json: circuit.db
      .toArray()
      .filter(
        (element) =>
          element.type.startsWith("source_") || element.type.startsWith("pcb_"),
      ),
    subcircuit_id: board.subcircuit_id,
  })
  expect(
    new Headers(requests[0].options?.headers).get("Tscircuit-Core-Version"),
  ).toBe(circuit.getCoreVersion())
  expect(board._asyncAutoroutingResult).toEqual(output)
  expect(board.renderPhaseStates.PcbTraceRender.dirty).toBe(true)
  await circuit.dispose()
})
