import { expect, test } from "bun:test"
import {
  createControlledFootprintFetch,
  createFootprintCircuit,
  flushFootprintContinuations,
  footprintResponse,
  footprintUrl,
} from "./helpers"

test("replacing an owned job cancels the old one and only the current generation commits", async () => {
  const { fetchFootprint, requests } = createControlledFootprintFetch({
    ignoreAbort: true,
  })
  const circuit = createFootprintCircuit({ fetch: fetchFootprint })
  const legacyRecordSettled = circuit.renderUntilSettled()
  const resistor = circuit.selectOne("resistor")!
  const priorChildren = resistor.children.length
  const scope = circuit.experimentalFootprintLoader!
  let newCommits = 0
  const replacement = scope.load(resistor, {
    url: footprintUrl,
    isCurrent: () => true,
    decode: async (response) => {
      await response.json()
      return []
    },
    commit: () => newCommits++,
    onError: () => {
      throw new Error("Replacement unexpectedly failed")
    },
  })
  await legacyRecordSettled
  expect(requests[0].signal.aborted).toBe(true)
  expect(requests[1].signal.aborted).toBe(false)
  expect(scope.activeJobCount).toBe(1)
  requests[0].resolve(footprintResponse())
  await flushFootprintContinuations()
  expect(resistor.children).toHaveLength(priorChildren)
  expect(scope.activeJobCount).toBe(1)
  requests[1].resolve(footprintResponse())
  await replacement
  expect(newCommits).toBe(1)
  expect(scope.activeJobCount).toBe(0)
})
