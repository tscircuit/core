import { expect, test } from "bun:test"
import type { SupplierPartNumbers } from "@tscircuit/props"
import {
  createLoadingCircuit,
  flushLoading,
  loadingDeferred,
} from "./loading-fixture"

test("removed supplier lookup cannot write its cache while a live concurrent lookup completes", async () => {
  const blocked = loadingDeferred<SupplierPartNumbers>()
  const writtenKeys: string[] = []
  const circuit = createLoadingCircuit({
    partsEngine: {
      findPart: ({ sourceComponent }) =>
        "name" in sourceComponent && sourceComponent.name === "R1"
          ? blocked.promise
          : { jlcpcb: ["live"] },
    },
    localCacheEngine: {
      getItem: () => null,
      setItem: (key) => {
        writtenKeys.push(key)
      },
    },
  })
  circuit.add(
    <board width={10} height={10}>
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={-2} />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={2} />
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  const removed = circuit.selectOne(".R1")!
  removed.parent!.remove(removed)
  await settled
  blocked.resolve({ jlcpcb: ["stale"] })
  await flushLoading()
  expect(writtenKeys).toHaveLength(1)
  expect(JSON.parse(writtenKeys[0]).name).toBe("R2")
  expect(
    circuit.db.source_component
      .list()
      .find((source) => "name" in source && source.name === "R2")
      ?.supplier_part_numbers,
  ).toEqual({ jlcpcb: ["live"] })
  expect(circuit.db.source_part_not_found_warning.list()).toHaveLength(0)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
