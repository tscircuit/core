import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import {
  createLoadingCircuit,
  flushLoading,
  loadingDeferred,
  loadingOrientationChip,
  loadingSupplierPads,
} from "./loading-fixture"

test("replacement orientation generation rejoins the live shared producer without accepting its abandoned result", async () => {
  const abandoned = loadingDeferred<AnyCircuitElement[]>()
  const current = loadingDeferred<AnyCircuitElement[]>()
  let fetchCalls = 0
  let cacheWrites = 0
  const circuit = createLoadingCircuit({
    partsEngine: {
      findPart: () => ({}),
      fetchPartCircuitJson: () =>
        ++fetchCalls === 1 ? abandoned.promise : current.promise,
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
  const first = circuit.selectOne(".U1")!
  first.setProps({ ...first.props, pcbX: 2 })
  await flushLoading()
  expect(fetchCalls).toBe(2)
  current.resolve(loadingSupplierPads)
  await settled
  expect(cacheWrites).toBe(1)
  expect(
    circuit.db.pcb_component
      .list()
      .filter((pcb) => pcb.supplier_pin1_location_map?.jlcpcb),
  ).toHaveLength(2)
  const output = structuredClone(circuit.getCircuitJson())
  abandoned.resolve([])
  await flushLoading()
  expect(circuit.getCircuitJson()).toEqual(output)
  expect(cacheWrites).toBe(1)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
