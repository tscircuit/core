import type { SupplierPartNumbers } from "@tscircuit/props"
import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { Board } from "lib/components/normal-components/Board/Board"
import { Resistor } from "lib/components/normal-components/Resistor"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  flushLoadingRevisionMicrotasks,
  loadingRevisionDeferred,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

type SupplierQuery = Parameters<Resistor["_getSupplierPartNumbersEffect"]>[0]

test("D1 old supplier finalizers preserve an immediately restarted lookup's guard", async () => {
  const stale: SupplierPartNumbers = { jlcpcb: ["stale"] }
  const current: SupplierPartNumbers = { jlcpcb: ["current"] }
  const oldResult = loadingRevisionDeferred<SupplierPartNumbers>()
  const currentResult = loadingRevisionDeferred<SupplierPartNumbers>()
  const firstStarted = loadingRevisionDeferred<void>()
  const currentStarted = loadingRevisionDeferred<void>()
  const oldCleanupStarted = loadingRevisionDeferred<void>()
  const releaseOldCleanup = loadingRevisionDeferred<void>()
  const oldEnded = loadingRevisionDeferred<void>()
  const events: string[] = []
  const jobIds: string[] = []
  const endedJobIds: string[] = []
  const endErrors: string[] = []
  const cached: string[] = []
  let providerCalls = 0
  let cacheReads = 0
  let cleanupFinished = false

  class SupplierCleanupExtension extends Resistor {
    lookupCalls = 0

    protected override _getSupplierPartNumbersEffect(query: SupplierQuery) {
      const program = super._getSupplierPartNumbersEffect(query)
      if (++this.lookupCalls !== 1) return program
      return program.pipe(
        Effect.ensuring(
          Effect.promise(async () => {
            events.push("old_cleanup_started")
            oldCleanupStarted.resolve()
            await releaseOldCleanup.promise
            cleanupFinished = true
            events.push("old_cleanup_finished")
          }),
        ),
      )
    }

    notifySupplierDirty() {
      this._markDirty("PartsEngineRender")
    }
  }

  const circuit = createLoadingRevisionCircuit({
    drcChecksDisabled: true,
    localCacheEngine: {
      getItem: () => {
        cacheReads++
        return null
      },
      setItem: (_key, value) => {
        cached.push(value)
      },
    },
    partsEngine: {
      findPart: () => {
        providerCalls++
        events.push(`find_part:${providerCalls}`)
        if (providerCalls === 1) {
          firstStarted.resolve()
          return oldResult.promise
        }
        currentStarted.resolve()
        return currentResult.promise
      },
    },
  })
  circuit.on(
    "asyncEffect:start",
    (event: { effectName: string; asyncEffectId: string }) => {
      if (event.effectName !== "get-supplier-part-numbers") return
      jobIds.push(event.asyncEffectId)
      events.push(`supplier_start:${jobIds.length}`)
    },
  )
  circuit.on(
    "asyncEffect:end",
    (event: { effectName: string; asyncEffectId: string; error?: string }) => {
      if (event.effectName !== "get-supplier-part-numbers") return
      endedJobIds.push(event.asyncEffectId)
      events.push(`supplier_end:${jobIds.indexOf(event.asyncEffectId) + 1}`)
      if (event.error !== undefined) endErrors.push(event.error)
      if (event.asyncEffectId === jobIds[0]) oldEnded.resolve()
    },
  )
  const resistor = new SupplierCleanupExtension({
    name: "R1",
    resistance: "10k",
    footprint: "0402",
  })
  const getSupplierNumbers = () => {
    const source = circuit
      .getCircuitJson()
      .find(
        (element) =>
          element.type === "source_component" && element.name === "R1",
      )
    return source?.type === "source_component"
      ? source.supplier_part_numbers
      : undefined
  }
  let settled: Promise<void> | undefined
  try {
    const board = new Board({ width: 10, height: 10 })
    board.add(resistor)
    circuit.add(board)
    settled = circuit.renderUntilSettled()
    await firstStarted.promise

    // No await or microtask flush between cancellation and this replacement
    // render: the old job's finalizer cannot yet release its pending token.
    resistor.setProps({ ...resistor.props, pcbX: 2 })
    circuit.render()
    reportLoadingRevisionObservation("D1", "immediate_supplier_restart", {
      lookupCalls: resistor.lookupCalls,
      starts: jobIds.length,
      ends: endedJobIds.length,
      cleanupFinished,
      supplierPartNumbers: getSupplierNumbers(),
    })
    expect(resistor.lookupCalls).toBe(2)
    expect(jobIds).toHaveLength(2)
    expect(endedJobIds).toEqual([])
    expect(cleanupFinished).toBe(false)
    await oldCleanupStarted.promise
    await currentStarted.promise

    // The old callback resolves while its interrupted cleanup is still held.
    // It must neither publish nor start a stale cache write.
    oldResult.resolve(stale)
    await flushLoadingRevisionMicrotasks()
    expect(getSupplierNumbers()).toBeUndefined()
    expect(cached).toEqual([])
    expect(providerCalls).toBe(2)

    releaseOldCleanup.resolve()
    await oldEnded.promise
    expect(cleanupFinished).toBe(true)
    // End delivery proves the old native finalizer and outer token finalizer
    // have completed. The replacement result is still manually unresolved.
    resistor.notifySupplierDirty()
    circuit.render()
    await flushLoadingRevisionMicrotasks()
    reportLoadingRevisionObservation("D1", "after_old_supplier_finalizer", {
      lookupCalls: resistor.lookupCalls,
      providerCalls,
      cacheReads,
      starts: jobIds.length,
      ends: endedJobIds.length,
      cached,
      supplierPartNumbers: getSupplierNumbers(),
    })
    expect(resistor.lookupCalls).toBe(2)
    expect(providerCalls).toBe(2)
    expect(cacheReads).toBe(2)
    expect(jobIds).toHaveLength(2)
    expect(endedJobIds).toEqual([jobIds[0]])
    expect(cached).toEqual([])
    expect(getSupplierNumbers()).toBeUndefined()

    currentResult.resolve(current)
    await settled
    const json = circuit.getCircuitJson()
    reportLoadingRevisionObservation("D1", "supplier_replacement_settled", {
      lookupCalls: resistor.lookupCalls,
      providerCalls,
      cacheReads,
      cached,
      jobIds,
      endedJobIds,
      endErrors,
      supplierPartNumbers: getSupplierNumbers(),
      events,
    })
    expect(getSupplierNumbers()).toEqual(current)
    expect(resistor.lookupCalls).toBe(2)
    expect(providerCalls).toBe(2)
    expect(cacheReads).toBe(2)
    expect(cached).toEqual([JSON.stringify(current)])
    expect(endedJobIds).toEqual(jobIds)
    expect(endErrors).toEqual([])
    expect(
      json.filter(
        (element) => element.type === "source_part_not_found_warning",
      ),
    ).toEqual([])
    expect(
      json.filter(
        (element) =>
          element.type === "source_component" && element.name === "R1",
      ),
    ).toHaveLength(1)
    expect(
      json.filter((element) => element.type === "pcb_smtpad"),
    ).toHaveLength(2)
  } finally {
    releaseOldCleanup.resolve()
    oldResult.resolve(stale)
    currentResult.resolve(current)
    await settled
    await disposeLoadingRevisionCircuit(circuit)
  }
})
