import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import {
  createLoadingCircuit,
  flushLoading,
  loadingDeferred,
  loadingOrientationChip,
  loadingSupplierPads,
} from "./loading-fixture"

test("a live orientation subscriber takes over an interrupted producer and rejects its late generation", async () => {
  const first = loadingDeferred<AnyCircuitElement[]>()
  const replacement = loadingDeferred<AnyCircuitElement[]>()
  let fetchCalls = 0
  let cacheWrites = 0
  const circuit = createLoadingCircuit({
    partsEngine: {
      findPart: () => ({}),
      fetchPartCircuitJson: () =>
        ++fetchCalls === 1 ? first.promise : replacement.promise,
    },
    localCacheEngine: {
      getItem: () => null,
      setItem: () => {
        cacheWrites++
      },
    },
  })
  circuit.add(
    <board width={15} height={10}>
      {loadingOrientationChip("U1")}
      {loadingOrientationChip("U2")}
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  await flushLoading()
  expect(fetchCalls).toBe(1)
  const producer = circuit.selectOne(".U1")!
  producer.parent!.remove(producer)
  await flushLoading()
  expect(fetchCalls).toBe(2)
  replacement.resolve(loadingSupplierPads)
  await settled
  expect(cacheWrites).toBe(1)
  const live = circuit.db.source_component
    .list()
    .find((source) => source.name === "U2")!
  expect(
    circuit.db.pcb_component
      .list()
      .find((pcb) => pcb.source_component_id === live.source_component_id)
      ?.supplier_pin1_location_map?.jlcpcb,
  ).toBeDefined()
  const beforeLateResult = structuredClone(circuit.getCircuitJson())
  first.resolve([])
  await flushLoading()
  expect(circuit.getCircuitJson()).toEqual(beforeLateResult)
  expect(cacheWrites).toBe(1)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
