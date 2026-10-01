import { expect, test } from "bun:test"
import type { SupplierPartNumbers } from "@tscircuit/props"
import { createLoadingCircuit, loadingSupplierPads } from "./loading-fixture"

test("sync cache awaits retain connector callback order, source IDs and deferred supplier commits", async () => {
  for (const configuredCache of [false, true]) {
    const events: string[] = []
    const callbackSourceIds: Array<string | null | undefined> = []
    const cacheWriteObservers: Array<SupplierPartNumbers | undefined> = []
    const circuit = createLoadingCircuit({
      enablePartOrientationAnalysis: false,
      ...(configuredCache
        ? {
            localCacheEngine: {
              getItem: () => {
                events.push("cache_read")
                return null
              },
              setItem: () => {
                events.push("cache_write")
                queueMicrotask(() => {
                  cacheWriteObservers.push(
                    circuit.db.source_component.list()[0]
                      ?.supplier_part_numbers,
                  )
                })
              },
            },
          }
        : {}),
      partsEngine: {
        findPart: () => {
          events.push("find_part")
          callbackSourceIds.push(circuit.selectOne(".J1")!.source_component_id)
          return { jlcpcb: ["live"] }
        },
        fetchPartCircuitJson: () => loadingSupplierPads,
      },
    })
    try {
      circuit.add(
        <board>
          <connector name="J1" standard="jst_ph" pinCount={2} />
        </board>,
      )
      circuit.render()
      events.push("render_returned")
      expect(events).toEqual(
        configuredCache
          ? ["cache_read", "render_returned"]
          : ["find_part", "render_returned"],
      )
      await circuit.renderUntilSettled()
      expect(events).toEqual(
        configuredCache
          ? ["cache_read", "render_returned", "find_part", "cache_write"]
          : ["find_part", "render_returned"],
      )
      const source = circuit.db.source_component.list()[0]!
      expect(callbackSourceIds).toEqual([
        configuredCache ? source.source_component_id : null,
      ])
      expect(source.supplier_part_numbers).toEqual({ jlcpcb: ["live"] })
      expect(cacheWriteObservers).toEqual(configuredCache ? [undefined] : [])
      expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
    } finally {
      await circuit.dispose()
    }
  }
})
