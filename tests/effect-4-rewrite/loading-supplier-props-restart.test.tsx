import { expect, test } from "bun:test"
import type { SupplierPartNumbers } from "@tscircuit/props"
import {
  createLoadingCircuit,
  flushLoading,
  loadingDeferred,
} from "./loading-fixture"

test("prop updates restart pending supplier lookup and only the current generation writes cache/output", async () => {
  const abandoned = loadingDeferred<SupplierPartNumbers>()
  const current = loadingDeferred<SupplierPartNumbers>()
  let findCalls = 0
  let cacheWrites = 0
  const circuit = createLoadingCircuit({
    partsEngine: {
      findPart: () => (++findCalls === 1 ? abandoned.promise : current.promise),
    },
    localCacheEngine: {
      getItem: () => null,
      setItem: () => {
        cacheWrites++
      },
    },
  })
  circuit.add(
    <board>
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  await flushLoading()
  expect(findCalls).toBe(1)
  const resistor = circuit.selectOne(".R1")!
  resistor.setProps({ ...resistor.props, pcbX: 1 })
  await flushLoading()
  expect(findCalls).toBe(2)
  current.resolve({ jlcpcb: ["current"] })
  await settled
  abandoned.resolve({ jlcpcb: ["stale"] })
  await flushLoading()
  expect(circuit.db.source_component.list()[0]?.supplier_part_numbers).toEqual({
    jlcpcb: ["current"],
  })
  expect(cacheWrites).toBe(1)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
