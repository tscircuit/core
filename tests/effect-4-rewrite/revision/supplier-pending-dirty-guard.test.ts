import type { PartsEngine, SupplierPartNumbers } from "@tscircuit/props"
import { expect, test } from "bun:test"
import type { RenderPhase } from "lib/components/base-components/Renderable"
import { Board } from "lib/components/normal-components/Board/Board"
import { Resistor } from "lib/components/normal-components/Resistor"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  flushLoadingRevisionMicrotasks,
  loadingRevisionDeferred,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

type SupplierSource = Parameters<PartsEngine["findPart"]>[0]["sourceComponent"]

class SupplierRerenderExtension extends Resistor {
  notifySupplierDirty(phase: RenderPhase) {
    this._markDirty(phase)
  }

  callBaseSupplier(
    partsEngine: PartsEngine,
    sourceComponent: SupplierSource,
    footprinterString: string | undefined,
  ): Promise<SupplierPartNumbers> {
    return super._getSupplierPartNumbers(
      partsEngine,
      sourceComponent,
      footprinterString,
    )
  }
}

type SupplierDirtyObservation = {
  scenario: string
  pending: {
    supplierPartNumbers: SupplierPartNumbers | undefined
    providerCalls: number
    legacyCalls: number
    cacheReads: number
    cached: string[]
    starts: number
    ends: number
  }
  supplierPartNumbers: SupplierPartNumbers | undefined
  providerCalls: number
  legacyCalls: number
  cacheReads: number
  cached: string[]
  starts: number
  ends: number
  endErrors: string[]
  sourceCount: number
  padCount: number
  warningCount: number
  events: string[]
}

test("D1 noncancelling extension dirtiness reuses one pending supplier lookup", async () => {
  const supplierPartNumbers: SupplierPartNumbers = { jlcpcb: ["pending-once"] }
  const observations: SupplierDirtyObservation[] = []
  for (const adapter of ["native_base", "legacy_promise"] as const) {
    for (const phase of [
      "PartsEngineRender",
      "PcbFootprintStringRender",
    ] as const) {
      const result = loadingRevisionDeferred<SupplierPartNumbers>()
      const firstStarted = loadingRevisionDeferred<void>()
      const events: string[] = []
      const endErrors: string[] = []
      const cached: string[] = []
      let providerCalls = 0
      let legacyCalls = 0
      let cacheReads = 0
      let starts = 0
      let ends = 0
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
            events.push("find_part")
            firstStarted.resolve()
            return result.promise
          },
        },
      })
      const resistor = new SupplierRerenderExtension({
        name: "R1",
        resistance: "10k",
        footprint: "0402",
      })
      if (adapter === "legacy_promise") {
        // A dynamic legacy override delegates to the historical Promise facade,
        // so both adapters exercise the real provider and configured cache.
        Object.defineProperty(resistor, "_getSupplierPartNumbers", {
          value: (
            partsEngine: PartsEngine,
            sourceComponent: SupplierSource,
            footprinterString: string | undefined,
          ) => {
            legacyCalls++
            events.push("legacy_override")
            return resistor.callBaseSupplier(
              partsEngine,
              sourceComponent,
              footprinterString,
            )
          },
        })
      }
      circuit.on("asyncEffect:start", (event: { effectName: string }) => {
        if (event.effectName !== "get-supplier-part-numbers") return
        starts++
        events.push("supplier_start")
      })
      circuit.on(
        "asyncEffect:end",
        (event: { effectName: string; error?: string }) => {
          if (event.effectName !== "get-supplier-part-numbers") return
          ends++
          events.push("supplier_end")
          if (event.error !== undefined) endErrors.push(event.error)
        },
      )
      let settled: Promise<void> | undefined
      try {
        const board = new Board({ width: 10, height: 10 })
        board.add(resistor)
        circuit.add(board)
        settled = circuit.renderUntilSettled()
        await firstStarted.promise

        // This extension notification does not replace props or cancel work.
        resistor.notifySupplierDirty(phase)
        events.push(`dirty:${phase}`)
        circuit.render()
        events.push("manual_render_returned")
        await flushLoadingRevisionMicrotasks()
        const pendingSource = circuit
          .getCircuitJson()
          .find(
            (element) =>
              element.type === "source_component" && element.name === "R1",
          )
        const pending = {
          supplierPartNumbers:
            pendingSource?.type === "source_component"
              ? pendingSource.supplier_part_numbers
              : undefined,
          providerCalls,
          legacyCalls,
          cacheReads,
          cached: [...cached],
          starts,
          ends,
        }

        result.resolve(supplierPartNumbers)
        await settled
        const json = circuit.getCircuitJson()
        const source = json.find(
          (element) =>
            element.type === "source_component" && element.name === "R1",
        )
        const observation: SupplierDirtyObservation = {
          scenario: `${adapter}:${phase}`,
          pending,
          supplierPartNumbers:
            source?.type === "source_component"
              ? source.supplier_part_numbers
              : undefined,
          providerCalls,
          legacyCalls,
          cacheReads,
          cached: [...cached],
          starts,
          ends,
          endErrors: [...endErrors],
          sourceCount: json.filter(
            (element) =>
              element.type === "source_component" && element.name === "R1",
          ).length,
          padCount: json.filter((element) => element.type === "pcb_smtpad")
            .length,
          warningCount: json.filter(
            (element) => element.type === "source_part_not_found_warning",
          ).length,
          events: [...events],
        }
        observations.push(observation)
        reportLoadingRevisionObservation(
          "D1",
          observation.scenario,
          observation,
        )
      } finally {
        result.resolve(supplierPartNumbers)
        await settled
        await disposeLoadingRevisionCircuit(circuit)
      }
    }
  }

  // Collect every scenario before asserting, so a red candidate still records
  // both the actual native path and the dynamic legacy Promise path.
  expect(observations).toHaveLength(4)
  for (const observation of observations) {
    const expectedLegacyCalls = observation.scenario.startsWith("legacy_")
      ? 1
      : 0
    expect({
      scenario: observation.scenario,
      pending: observation.pending,
    }).toEqual({
      scenario: observation.scenario,
      pending: {
        supplierPartNumbers: undefined,
        providerCalls: 1,
        legacyCalls: expectedLegacyCalls,
        cacheReads: 1,
        cached: [],
        starts: 1,
        ends: 0,
      },
    })
    expect(observation.supplierPartNumbers).toEqual(supplierPartNumbers)
    expect(observation.providerCalls).toBe(1)
    expect(observation.legacyCalls).toBe(expectedLegacyCalls)
    expect(observation.cacheReads).toBe(1)
    expect(observation.cached).toEqual([JSON.stringify(supplierPartNumbers)])
    expect(observation.starts).toBe(1)
    expect(observation.ends).toBe(1)
    expect(observation.endErrors).toEqual([])
    expect(observation.sourceCount).toBe(1)
    expect(observation.padCount).toBe(2)
    expect(observation.warningCount).toBe(0)
  }
})
