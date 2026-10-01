import type { SupplierPartNumbers } from "@tscircuit/props"
import { expect, test } from "bun:test"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  flushLoadingRevisionMicrotasks,
  loadingRevisionDeferred,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

test("H9 own props replacement retains exactly one effective supplier result and cache write", async () => {
  const abandoned = loadingRevisionDeferred<SupplierPartNumbers>()
  const current = loadingRevisionDeferred<SupplierPartNumbers>()
  const firstStarted = loadingRevisionDeferred<void>()
  let calls = 0
  const cached: SupplierPartNumbers[] = []
  const circuit = createLoadingRevisionCircuit({
    localCacheEngine: {
      getItem: () => null,
      setItem: (_key, value) => {
        cached.push(JSON.parse(value))
      },
    },
    partsEngine: {
      findPart: () => {
        if (++calls === 1) {
          firstStarted.resolve()
          return abandoned.promise
        }
        return current.promise
      },
    },
  })
  let settled: Promise<void> | undefined
  try {
    circuit.add(
      <board>
        <resistor name="R1" resistance="10k" footprint="0402" />
      </board>,
    )
    settled = circuit.renderUntilSettled()
    await firstStarted.promise
    const resistor = circuit.selectOne(".R1")!
    resistor.setProps({ ...resistor.props, pcbX: 2 })
    await flushLoadingRevisionMicrotasks()
    // Resolve both generations before asserting so a baseline with no restart settles too.
    current.resolve({ jlcpcb: ["current"] })
    abandoned.resolve({ jlcpcb: ["stale"] })
    await settled
    const json = circuit.getCircuitJson()
    const source = json.find(
      (element) => element.type === "source_component" && element.name === "R1",
    )
    reportLoadingRevisionObservation("H9", "supplier_props", {
      calls,
      cached,
      source,
    })
    expect(calls).toBe(2)
    expect(cached).toEqual([{ jlcpcb: ["current"] }])
    expect(
      source?.type === "source_component" && source.supplier_part_numbers,
    ).toEqual({ jlcpcb: ["current"] })
    expect(
      json.filter((element) => element.type === "pcb_smtpad"),
    ).toHaveLength(2)
    expect(
      json.filter(
        (element) => element.type === "source_part_not_found_warning",
      ),
    ).toHaveLength(0)
  } finally {
    abandoned.resolve({ jlcpcb: ["stale"] })
    current.resolve({ jlcpcb: ["current"] })
    await settled
    await disposeLoadingRevisionCircuit(circuit)
  }
})
