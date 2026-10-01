import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import {
  createLoadingCircuit,
  flushLoading,
  loadingDeferred,
  loadingOrientationChip,
  loadingSupplierPads,
} from "./loading-fixture"

test("disposing the final orientation producer releases the shared key for the next circuit", async () => {
  const abandoned = loadingDeferred<AnyCircuitElement[]>()
  let fetchCalls = 0
  const partsEngine = {
    findPart: () => ({}),
    fetchPartCircuitJson: () =>
      ++fetchCalls === 1 ? abandoned.promise : loadingSupplierPads,
  }
  const first = createLoadingCircuit({ partsEngine })
  first.add(<board>{loadingOrientationChip("U1")}</board>)
  first.render()
  await flushLoading()
  expect(fetchCalls).toBe(1)
  await first.dispose()
  const next = createLoadingCircuit({ partsEngine })
  next.add(<board>{loadingOrientationChip("U2")}</board>)
  await next.renderUntilSettled()
  expect(fetchCalls).toBe(2)
  expect(
    next.db.pcb_component.list()[0]?.supplier_pin1_location_map?.jlcpcb,
  ).toBeDefined()
  expect(first.effectRuntime.activeJobCount).toBe(0)
  expect(next.effectRuntime.activeJobCount).toBe(0)
  abandoned.resolve([])
  await next.dispose()
})
