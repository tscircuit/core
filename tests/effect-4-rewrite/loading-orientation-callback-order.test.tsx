import { expect, test } from "bun:test"
import {
  createLoadingCircuit,
  loadingOrientationChip,
  loadingSupplierPads,
} from "./loading-fixture"

test("orientation callbacks retain the optional-cache await seam before reading source and PCB records", async () => {
  for (const configuredCache of [false, true]) {
    const events: string[] = []
    const circuit = createLoadingCircuit({
      ...(configuredCache
        ? {
            localCacheEngine: {
              getItem: () => {
                events.push("cache_read")
                return null
              },
              setItem: () => {
                events.push("cache_write")
              },
            },
          }
        : {}),
      partsEngine: {
        findPart: () => ({}),
        fetchPartCircuitJson: () => {
          events.push("fetch_orientation")
          const chip = circuit.selectOne(".U1")!
          expect(
            circuit.db.source_component.get(chip.source_component_id!),
          ).toBeDefined()
          expect(
            circuit.db.pcb_component.get(chip.pcb_component_id!),
          ).toBeDefined()
          return loadingSupplierPads
        },
      },
    })
    try {
      circuit.add(<board>{loadingOrientationChip("U1")}</board>)
      circuit.render()
      events.push("render_returned")
      expect(events).toEqual(
        configuredCache
          ? ["cache_read", "render_returned"]
          : ["render_returned"],
      )
      await circuit.renderUntilSettled()
      expect(events).toEqual(
        configuredCache
          ? [
              "cache_read",
              "render_returned",
              "fetch_orientation",
              "cache_write",
            ]
          : ["render_returned", "fetch_orientation"],
      )
      expect(
        circuit.db.pcb_component.list()[0]?.supplier_pin1_location_map?.jlcpcb,
      ).toBeDefined()
    } finally {
      await circuit.dispose()
    }
  }
})
