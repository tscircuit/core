import { expect, test } from "bun:test"
import { runCoreSync } from "lib/effect/core-error"
import {
  getSpiceyEngine,
  simulateSpiceyEffect,
} from "lib/spice/get-spicey-engine"
import { simulate, spiceyTranToVGraphs } from "spicey"

test("Effect spicey adapter preserves the legacy kernel result and Promise error boundary", async () => {
  const spiceString =
    "* RC\nv1 1 0 5\nr1 1 2 1000\nc1 2 0 1u\n.tran 0.0001 0.001\n.end"
  const legacy = simulate(spiceString)
  const expected = {
    simulationResultCircuitJson: spiceyTranToVGraphs(
      legacy.tran,
      legacy.circuit,
      "spice-experiment-1",
    ),
  }
  expect(runCoreSync(simulateSpiceyEffect(spiceString))).toEqual(expected)
  const pending = getSpiceyEngine().simulate(spiceString)
  expect(pending).toBeInstanceOf(Promise)
  expect(await pending).toEqual(expected)
  let legacyFailure: unknown
  try {
    simulate("R1")
  } catch (failure) {
    legacyFailure = failure
  }
  let rewrittenFailure: unknown
  try {
    await getSpiceyEngine().simulate("R1")
  } catch (failure) {
    rewrittenFailure = failure
  }
  expect(rewrittenFailure).toBeInstanceOf(Error)
  if (!(legacyFailure instanceof Error) || !(rewrittenFailure instanceof Error))
    throw new Error("Expected kernel parse failure")
  expect(rewrittenFailure.message).toBe(legacyFailure.message)
  expect(rewrittenFailure.name).toBe(legacyFailure.name)
})
